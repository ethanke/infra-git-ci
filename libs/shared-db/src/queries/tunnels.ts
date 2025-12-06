/**
 * Tunnel and subdomain queries
 */

import { query, queryOne, execute } from "../client.ts";

export interface DBReservedSubdomain {
  id: number;
  user_id: string;
  subdomain: string;
  domain: string;
  created_at: Date;
}

export async function getReservedSubdomains(userId: string): Promise<DBReservedSubdomain[]> {
  return query<DBReservedSubdomain>(
    `SELECT * FROM reserved_subdomains WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
}

export async function getReservedSubdomainByName(
  subdomain: string,
  domain = "t.lum.tools"
): Promise<DBReservedSubdomain | null> {
  return queryOne<DBReservedSubdomain>(
    `SELECT * FROM reserved_subdomains WHERE subdomain = $1 AND domain = $2`,
    [subdomain, domain]
  );
}

export async function reserveSubdomain(
  userId: string,
  subdomain: string,
  domain = "t.lum.tools"
): Promise<DBReservedSubdomain> {
  const result = await queryOne<DBReservedSubdomain>(
    `INSERT INTO reserved_subdomains (user_id, subdomain, domain)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, subdomain, domain]
  );
  return result!;
}

export async function releaseSubdomain(
  userId: string,
  subdomain: string,
  domain = "t.lum.tools"
): Promise<boolean> {
  const count = await execute(
    `DELETE FROM reserved_subdomains WHERE user_id = $1 AND subdomain = $2 AND domain = $3`,
    [userId, subdomain, domain]
  );
  return count > 0;
}

export async function getUserSubdomainCount(userId: string): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM reserved_subdomains WHERE user_id = $1`,
    [userId]
  );
  return parseInt(result?.count ?? "0");
}

// Tunnel activity queries (using activity_logs)
export async function getActiveTunnels(userId: string, hours = 24): Promise<{
  tunnel_name: string;
  subdomain: string | null;
  url: string;
  proxy_type: string;
  connected_at: Date;
}[]> {
  // Get connects without matching disconnects
  const connects = await query<{
    id: string;
    resource: string;
    extra_data: Record<string, unknown>;
    created_at: Date;
  }>(
    `SELECT id, resource, extra_data, created_at 
     FROM activity_logs 
     WHERE user_id = $1 
       AND action = 'tunnel_connect'
       AND created_at >= NOW() - INTERVAL '${hours} hours'
     ORDER BY created_at DESC`,
    [userId]
  );

  const disconnects = await query<{ extra_data: Record<string, unknown> }>(
    `SELECT extra_data FROM activity_logs 
     WHERE user_id = $1 
       AND action = 'tunnel_disconnect'
       AND created_at >= NOW() - INTERVAL '${hours} hours'`,
    [userId]
  );

  const disconnectedTunnels = new Set(
    disconnects.map(d => d.extra_data?.tunnel_name as string).filter(Boolean)
  );

  return connects
    .filter(c => !disconnectedTunnels.has(c.extra_data?.tunnel_name as string))
    .map(c => ({
      tunnel_name: c.extra_data?.tunnel_name as string,
      subdomain: c.extra_data?.subdomain as string | null,
      url: c.resource,
      proxy_type: (c.extra_data?.proxy_type as string) ?? "http",
      connected_at: c.created_at,
    }));
}

export async function getTunnelStats(userId: string, days = 30): Promise<{
  total_bytes_in: number;
  total_bytes_out: number;
  total_sessions: number;
  by_protocol: Record<string, { bytes_in: number; bytes_out: number; sessions: number }>;
}> {
  const trafficLogs = await query<{ extra_data: Record<string, unknown> }>(
    `SELECT extra_data FROM activity_logs 
     WHERE user_id = $1 
       AND action IN ('tunnel_disconnect', 'tunnel_traffic')
       AND created_at >= NOW() - INTERVAL '${days} days'`,
    [userId]
  );

  let totalBytesIn = 0;
  let totalBytesOut = 0;
  let totalSessions = 0;
  const byProtocol: Record<string, { bytes_in: number; bytes_out: number; sessions: number }> = {};

  for (const log of trafficLogs) {
    const data = log.extra_data ?? {};
    const bytesIn = (data.bytes_in as number) ?? 0;
    const bytesOut = (data.bytes_out as number) ?? 0;
    const proxyType = (data.proxy_type as string) ?? "http";

    totalBytesIn += bytesIn;
    totalBytesOut += bytesOut;
    totalSessions++;

    if (!byProtocol[proxyType]) {
      byProtocol[proxyType] = { bytes_in: 0, bytes_out: 0, sessions: 0 };
    }
    byProtocol[proxyType].bytes_in += bytesIn;
    byProtocol[proxyType].bytes_out += bytesOut;
    byProtocol[proxyType].sessions++;
  }

  return {
    total_bytes_in: totalBytesIn,
    total_bytes_out: totalBytesOut,
    total_sessions: totalSessions,
    by_protocol: byProtocol,
  };
}
