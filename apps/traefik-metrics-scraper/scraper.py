#!/usr/bin/env python3
"""
Traefik Access Log Scraper for FRP Tunnel Traffic Tracking

Monitors Traefik access logs (JSON format) to track per-tunnel traffic usage.
Aggregates traffic by subdomain and logs to platform for user attribution.
"""

import asyncio
import json
import os
import re
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict
import aiohttp
from kubernetes import client, config

# Configuration
PLATFORM_API_URL = os.getenv("PLATFORM_API_URL", "http://platform.platform.svc.cluster.local:3000")
PLATFORM_INTERNAL_SECRET = os.getenv("PLATFORM_INTERNAL_SECRET", "")
REPORT_INTERVAL = int(os.getenv("REPORT_INTERVAL", "60"))  # seconds
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

class TunnelTrafficAggregator:
    """Aggregates traffic per tunnel subdomain"""
    
    def __init__(self):
        self.traffic: Dict[str, Dict[str, int]] = defaultdict(lambda: {"bytes_in": 0, "bytes_out": 0, "requests": 0})
        self.last_report_time = datetime.utcnow()
    
    def add_request(self, subdomain: str, bytes_in: int, bytes_out: int):
        """Add traffic from a single request"""
        self.traffic[subdomain]["bytes_in"] += bytes_in
        self.traffic[subdomain]["bytes_out"] += bytes_out
        self.traffic[subdomain]["requests"] += 1
    
    def get_and_reset(self) -> Dict[str, Dict[str, int]]:
        """Get current traffic and reset counters"""
        current_traffic = dict(self.traffic)
        self.traffic = defaultdict(lambda: {"bytes_in": 0, "bytes_out": 0, "requests": 0})
        self.last_report_time = datetime.utcnow()
        return current_traffic


class TraefikLogScraper:
    """Scrapes Traefik access logs via Kubernetes API"""
    
    def __init__(self):
        self.aggregator = TunnelTrafficAggregator()
        self.session: aiohttp.ClientSession = None
        self.last_timestamp = None
        
        # Load Kubernetes config
        try:
            config.load_incluster_config()
            print("[INFO] Loaded in-cluster Kubernetes config", flush=True)
        except Exception as e:
            print(f"[WARN] In-cluster config failed: {e}", flush=True)
            config.load_kube_config()
            print("[INFO] Loaded local Kubernetes config", flush=True)
        
        self.v1 = client.CoreV1Api()
        print("[INFO] Kubernetes API client initialized", flush=True)
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def extract_subdomain(self, request_host: str) -> str | None:
        """Extract subdomain from RequestHost"""
        match = re.match(r'^(.+?)\.t\.lum\.tools$', request_host)
        if match:
            return match.group(1)
        return None
    
    def process_log_line(self, log_line: str):
        """Process a single Traefik access log line"""
        try:
            log_data = json.loads(log_line)
            
            # Only process tunnel requests
            request_host = log_data.get("RequestHost", "")
            if not request_host.endswith(".t.lum.tools"):
                return
            
            subdomain = self.extract_subdomain(request_host)
            if not subdomain:
                return
            
            # Extract traffic data
            bytes_in = log_data.get("RequestContentSize", 0)
            bytes_out = log_data.get("DownstreamContentSize", 0)
            
            # Aggregate
            self.aggregator.add_request(subdomain, bytes_in, bytes_out)
            
            if LOG_LEVEL == "DEBUG":
                print(f"[DEBUG] {subdomain}: +{bytes_in}B in, +{bytes_out}B out", flush=True)
        
        except json.JSONDecodeError:
            pass  # Skip non-JSON lines
        except Exception as e:
            if LOG_LEVEL == "DEBUG":
                print(f"[ERROR] Failed to process log line: {e}", flush=True)
    
    async def log_tunnel_traffic(self, subdomain: str, bytes_in: int, bytes_out: int, requests: int):
        """Log traffic data to platform API"""
        if bytes_in == 0 and bytes_out == 0:
            return  # Skip if no traffic
        
        url = f"{PLATFORM_API_URL}/api/v1/activity-logs/tunnel-traffic"
        
        payload = {
            "subdomain": subdomain,
            "bytes_in": bytes_in,
            "bytes_out": bytes_out,
            "timestamp": datetime.utcnow().isoformat(),
        }
        
        headers = {
            "Content-Type": "application/json",
            "x-internal-secret": PLATFORM_INTERNAL_SECRET,
        }
        
        try:
            async with self.session.post(url, json=payload, headers=headers, timeout=10) as resp:
                if resp.status == 201:
                    resp_data = await resp.json()
                    print(f"[INFO] ✅ {subdomain}: ↓{bytes_in}B ↑{bytes_out}B ({requests}req) → User:{resp_data.get('user_id','?')[:12]}", flush=True)
                elif resp.status == 200:
                    resp_data = await resp.json()
                    if resp_data.get('status') == "skipped" and LOG_LEVEL == "DEBUG":
                        print(f"[DEBUG] Skipped {subdomain}: {resp_data.get('reason', '')}", flush=True)
                else:
                    text = await resp.text()
                    print(f"[WARN] Failed {subdomain}: HTTP {resp.status} - {text[:100]}", flush=True)
        except Exception as e:
            print(f"[ERROR] Failed to log {subdomain}: {e}", flush=True)
    
    async def report_traffic(self):
        """Report aggregated traffic to platform"""
        traffic_data = self.aggregator.get_and_reset()
        
        if not traffic_data:
            print(f"[INFO] No tunnel traffic in last {REPORT_INTERVAL}s", flush=True)
            return
        
        print(f"[INFO] Reporting {len(traffic_data)} tunnel(s)", flush=True)
        
        for subdomain, data in traffic_data.items():
            await self.log_tunnel_traffic(
                subdomain, 
                data["bytes_in"], 
                data["bytes_out"],
                data["requests"]
            )
    
    def get_recent_logs(self, pod_name: str, since_seconds: int = 65) -> str:
        """Get recent logs from a pod (non-blocking)"""
        try:
            logs = self.v1.read_namespaced_pod_log(
                name=pod_name,
                namespace="traefik",
                since_seconds=since_seconds,
                tail_lines=1000  # Last 1000 lines
            )
            return logs
        except Exception as e:
            print(f"[ERROR] Failed to read pod logs: {e}", flush=True)
            return ""
    
    async def poll_and_process_logs(self):
        """Poll Traefik logs periodically and process them"""
        print("[INFO] Starting periodic log polling...", flush=True)
        
        # Get list of Traefik pods
        pods = self.v1.list_namespaced_pod(
            namespace="traefik",
            label_selector="app.kubernetes.io/name=traefik"
        )
        
        if not pods.items:
            print("[ERROR] No Traefik pods found!", flush=True)
            return
        
        pod_name = pods.items[0].metadata.name
        print(f"[INFO] Polling logs from pod: {pod_name}", flush=True)
        
        while True:
            # Get recent logs (last REPORT_INTERVAL + 5 seconds to avoid gaps)
            logs = await asyncio.get_event_loop().run_in_executor(
                None, 
                self.get_recent_logs, 
                pod_name, 
                REPORT_INTERVAL + 5
            )
            
            if logs:
                # Process each line
                lines_processed = 0
                for line in logs.split('\n'):
                    if line.strip():
                        self.process_log_line(line.strip())
                        lines_processed += 1
                
                if LOG_LEVEL == "DEBUG":
                    print(f"[DEBUG] Processed {lines_processed} log lines", flush=True)
            
            # Report aggregated traffic
            await self.report_traffic()
            
            # Wait for next interval
            await asyncio.sleep(REPORT_INTERVAL)
    
    async def run(self):
        """Run scraper continuously"""
        print(f"[INFO] Starting Traefik access log scraper", flush=True)
        print(f"[INFO] Platform URL: {PLATFORM_API_URL}", flush=True)
        print(f"[INFO] Report interval: {REPORT_INTERVAL}s", flush=True)
        print("", flush=True)
        
        await self.poll_and_process_logs()


async def main():
    """Main entry point"""
    async with TraefikLogScraper() as scraper:
        await scraper.run()


if __name__ == "__main__":
    import sys
    # Force unbuffered output
    sys.stdout.reconfigure(line_buffering=True)
    sys.stderr.reconfigure(line_buffering=True)
    
    print("=" * 70, flush=True)
    print("Traefik Access Log Scraper for FRP Tunnel Traffic Tracking", flush=True)
    print("=" * 70, flush=True)
    print("", flush=True)
    
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"[FATAL] Scraper crashed: {e}", flush=True)
        import traceback
        traceback.print_exc()
        sys.exit(1)
