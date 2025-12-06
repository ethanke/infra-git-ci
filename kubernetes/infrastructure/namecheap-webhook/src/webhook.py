#!/usr/bin/env python3
"""
Namecheap External-DNS Webhook
Translates external-dns webhook protocol to Namecheap API calls.
"""

import os
import json
import logging
from flask import Flask, request, jsonify
import requests
from xml.etree import ElementTree

app = Flask(__name__)

# Configuration
NAMECHEAP_API_USER = os.environ.get("NAMECHEAP_API_USER", "")
NAMECHEAP_API_KEY = os.environ.get("NAMECHEAP_API_KEY", "")
NAMECHEAP_USERNAME = os.environ.get("NAMECHEAP_USERNAME", NAMECHEAP_API_USER)
DOMAIN_FILTER = os.environ.get("DOMAIN_FILTER", "")
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")

# Namecheap API endpoints
NAMECHEAP_API_URL = "https://api.namecheap.com/xml.response"

logging.basicConfig(level=getattr(logging, LOG_LEVEL.upper()))
logger = logging.getLogger(__name__)


def get_client_ip():
    """Get client IP for Namecheap API (required parameter)."""
    try:
        resp = requests.get("https://api.ipify.org", timeout=5)
        return resp.text.strip()
    except Exception:
        return "127.0.0.1"


CLIENT_IP = get_client_ip()
logger.info(f"Using client IP: {CLIENT_IP}")


def namecheap_request(command: str, params: dict) -> ElementTree.Element:
    """Make a request to Namecheap API."""
    base_params = {
        "ApiUser": NAMECHEAP_API_USER,
        "ApiKey": NAMECHEAP_API_KEY,
        "UserName": NAMECHEAP_USERNAME,
        "ClientIp": CLIENT_IP,
        "Command": command,
    }
    base_params.update(params)
    
    logger.debug(f"Namecheap request: {command}")
    resp = requests.get(NAMECHEAP_API_URL, params=base_params, timeout=30)
    resp.raise_for_status()
    
    root = ElementTree.fromstring(resp.content)
    
    # Check for API errors
    status = root.get("Status")
    if status != "OK":
        errors = root.find(".//Errors")
        if errors is not None:
            error_msgs = [e.text for e in errors.findall("Error")]
            raise Exception(f"Namecheap API error: {'; '.join(error_msgs)}")
    
    return root


def parse_domain(fqdn: str) -> tuple:
    """Parse FQDN into SLD and TLD."""
    # Remove trailing dot if present
    fqdn = fqdn.rstrip(".")
    parts = fqdn.split(".")
    
    # Handle subdomain.domain.tld
    if len(parts) >= 2:
        tld = parts[-1]
        sld = parts[-2]
        subdomain = ".".join(parts[:-2]) if len(parts) > 2 else "@"
        return sld, tld, subdomain
    
    raise ValueError(f"Invalid domain: {fqdn}")


def get_existing_records(sld: str, tld: str) -> list:
    """Get existing DNS records for a domain."""
    try:
        root = namecheap_request("namecheap.domains.dns.getHosts", {
            "SLD": sld,
            "TLD": tld,
        })
        
        records = []
        hosts = root.find(".//DomainDNSGetHostsResult")
        if hosts is not None:
            for host in hosts.findall("host"):
                records.append({
                    "HostId": host.get("HostId"),
                    "Name": host.get("Name"),
                    "Type": host.get("Type"),
                    "Address": host.get("Address"),
                    "TTL": host.get("TTL", "1800"),
                    "MXPref": host.get("MXPref", "10"),
                })
        return records
    except Exception as e:
        logger.error(f"Failed to get records: {e}")
        return []


def set_dns_records(sld: str, tld: str, records: list):
    """Set DNS records for a domain (replaces all records)."""
    params = {"SLD": sld, "TLD": tld}
    
    for i, record in enumerate(records, 1):
        params[f"HostName{i}"] = record.get("Name", "@")
        params[f"RecordType{i}"] = record.get("Type", "A")
        params[f"Address{i}"] = record.get("Address", "")
        params[f"TTL{i}"] = record.get("TTL", "1800")
        if record.get("Type") == "MX":
            params[f"MXPref{i}"] = record.get("MXPref", "10")
    
    namecheap_request("namecheap.domains.dns.setHosts", params)


# External-DNS Webhook Endpoints

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({"status": "ok"})


@app.route("/", methods=["GET"])
def root():
    """Domain filter endpoint for external-dns."""
    return jsonify({
        "domainFilter": [DOMAIN_FILTER] if DOMAIN_FILTER else [],
    })


@app.route("/records", methods=["GET"])
def get_records():
    """Get all DNS records."""
    if not DOMAIN_FILTER:
        return jsonify([])
    
    try:
        sld, tld, _ = parse_domain(DOMAIN_FILTER)
        existing = get_existing_records(sld, tld)
        
        # Convert to external-dns format
        endpoints = []
        for record in existing:
            if record["Type"] in ["A", "AAAA", "CNAME", "TXT"]:
                name = record["Name"]
                if name == "@":
                    fqdn = DOMAIN_FILTER
                else:
                    fqdn = f"{name}.{DOMAIN_FILTER}"
                
                endpoints.append({
                    "dnsName": fqdn,
                    "recordType": record["Type"],
                    "targets": [record["Address"]],
                    "recordTTL": int(record.get("TTL", 1800)),
                })
        
        return jsonify(endpoints)
    except Exception as e:
        logger.error(f"Error getting records: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/records", methods=["POST"])
def apply_changes():
    """Apply DNS record changes."""
    try:
        changes = request.get_json()
        logger.info(f"Applying changes: {json.dumps(changes, indent=2)}")
        
        if not DOMAIN_FILTER:
            return jsonify({"error": "No domain filter configured"}), 400
        
        sld, tld, _ = parse_domain(DOMAIN_FILTER)
        existing = get_existing_records(sld, tld)
        
        # Process creates
        for endpoint in changes.get("create", []):
            fqdn = endpoint.get("dnsName", "").rstrip(".")
            record_type = endpoint.get("recordType", "A")
            targets = endpoint.get("targets", [])
            ttl = endpoint.get("recordTTL", 1800)
            
            _, _, subdomain = parse_domain(fqdn)
            
            for target in targets:
                existing.append({
                    "Name": subdomain,
                    "Type": record_type,
                    "Address": target,
                    "TTL": str(ttl),
                })
        
        # Process deletes
        for endpoint in changes.get("delete", []):
            fqdn = endpoint.get("dnsName", "").rstrip(".")
            record_type = endpoint.get("recordType", "A")
            targets = endpoint.get("targets", [])
            
            _, _, subdomain = parse_domain(fqdn)
            
            existing = [r for r in existing if not (
                r["Name"] == subdomain and 
                r["Type"] == record_type and 
                r["Address"] in targets
            )]
        
        # Apply all records
        set_dns_records(sld, tld, existing)
        
        return jsonify({"status": "ok"})
    except Exception as e:
        logger.error(f"Error applying changes: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/adjustendpoints", methods=["POST"])
def adjust_endpoints():
    """Adjust endpoints (no-op for simple implementations)."""
    endpoints = request.get_json()
    return jsonify(endpoints)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8888))
    app.run(host="0.0.0.0", port=port)
