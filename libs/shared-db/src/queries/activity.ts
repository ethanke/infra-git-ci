/**
 * Activity log queries
 */

import { query, queryOne, execute } from "../client.ts";

export interface DBActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource: string | null;
  status: "success" | "error" | "pending";
  ip_address: string | null;
  user_agent: string | null;
  extra_data: Record<string, unknown> | null;
  created_at: Date;
}

export async function logActivity(activity: {
  user_id: string;
  action: string;
  resource?: string;
  status: "success" | "error" | "pending";
  ip_address?: string;
  user_agent?: string;
  extra_data?: Record<string, unknown>;
}): Promise<DBActivityLog> {
  const result = await queryOne<DBActivityLog>(
    `INSERT INTO activity_logs (user_id, action, resource, status, ip_address, user_agent, extra_data)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      activity.user_id,
      activity.action,
      activity.resource ?? null,
      activity.status,
      activity.ip_address ?? null,
      activity.user_agent ?? null,
      activity.extra_data ? JSON.stringify(activity.extra_data) : null,
    ]
  );
  return result!;
}

export async function getRecentActivities(
  userId?: string,
  limit = 100
): Promise<(DBActivityLog & { user_email?: string; user_name?: string })[]> {
  if (userId) {
    return query(
      `SELECT al.*, u.email as user_email, u.display_name as user_name
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.user_id = $1
       ORDER BY al.created_at DESC LIMIT $2`,
      [userId, limit]
    );
  }
  return query(
    `SELECT al.*, u.email as user_email, u.display_name as user_name
     FROM activity_logs al
     LEFT JOIN users u ON al.user_id = u.id
     ORDER BY al.created_at DESC LIMIT $1`,
    [limit]
  );
}

export async function getActivityStats(days = 7): Promise<{
  total: number;
  success: number;
  error: number;
  by_action: { action: string; count: number }[];
}> {
  const totalResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM activity_logs 
     WHERE created_at >= NOW() - INTERVAL '${days} days'`
  );
  
  const successResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM activity_logs 
     WHERE status = 'success' AND created_at >= NOW() - INTERVAL '${days} days'`
  );
  
  const errorResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM activity_logs 
     WHERE status = 'error' AND created_at >= NOW() - INTERVAL '${days} days'`
  );
  
  const byAction = await query<{ action: string; count: string }>(
    `SELECT action, COUNT(*) as count FROM activity_logs 
     WHERE created_at >= NOW() - INTERVAL '${days} days'
     GROUP BY action ORDER BY count DESC LIMIT 10`
  );
  
  return {
    total: parseInt(totalResult?.count ?? "0"),
    success: parseInt(successResult?.count ?? "0"),
    error: parseInt(errorResult?.count ?? "0"),
    by_action: byAction.map(r => ({ action: r.action, count: parseInt(r.count) })),
  };
}

export async function getTopUsersByActivity(days = 7, limit = 5): Promise<{
  user_id: string;
  email: string;
  name: string | null;
  activity_count: number;
}[]> {
  const result = await query<{
    user_id: string;
    email: string;
    display_name: string | null;
    count: string;
  }>(
    `SELECT u.id as user_id, u.email, u.display_name, COUNT(al.id) as count
     FROM users u
     JOIN activity_logs al ON u.id = al.user_id
     WHERE al.created_at >= NOW() - INTERVAL '${days} days'
     GROUP BY u.id, u.email, u.display_name
     ORDER BY count DESC LIMIT $1`,
    [limit]
  );
  
  return result.map(r => ({
    user_id: r.user_id,
    email: r.email,
    name: r.display_name,
    activity_count: parseInt(r.count),
  }));
}
