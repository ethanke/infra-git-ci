/**
 * User queries
 */

import { query, queryOne, execute } from "../client.ts";

export interface DBUser {
  id: string;
  email: string;
  display_name: string | null;
  photo_url: string | null;
  is_admin: boolean;
  created_at: Date;
  updated_at: Date;
  last_login: Date | null;
}

export async function getUserById(id: string): Promise<DBUser | null> {
  return queryOne<DBUser>(
    `SELECT id, email, display_name, photo_url, is_admin, created_at, updated_at, last_login
     FROM users WHERE id = $1`,
    [id]
  );
}

export async function getUserByEmail(email: string): Promise<DBUser | null> {
  return queryOne<DBUser>(
    `SELECT id, email, display_name, photo_url, is_admin, created_at, updated_at, last_login
     FROM users WHERE email = $1`,
    [email]
  );
}

export async function createOrUpdateUser(user: {
  id: string;
  email: string;
  display_name?: string | null;
  photo_url?: string | null;
}): Promise<DBUser> {
  const result = await queryOne<DBUser>(
    `INSERT INTO users (id, email, display_name, photo_url, last_login, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       display_name = COALESCE(EXCLUDED.display_name, users.display_name),
       photo_url = COALESCE(EXCLUDED.photo_url, users.photo_url),
       last_login = NOW(),
       updated_at = NOW()
     RETURNING id, email, display_name, photo_url, is_admin, created_at, updated_at, last_login`,
    [user.id, user.email, user.display_name ?? null, user.photo_url ?? null]
  );
  return result!;
}

export async function updateUser(
  userId: string,
  updates: { display_name?: string | null; photo_url?: string | null }
): Promise<DBUser | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;
  
  if (updates.display_name !== undefined) {
    sets.push(`display_name = $${paramIdx++}`);
    params.push(updates.display_name);
  }
  if (updates.photo_url !== undefined) {
    sets.push(`photo_url = $${paramIdx++}`);
    params.push(updates.photo_url);
  }
  
  if (sets.length === 0) return getUserById(userId);
  
  sets.push(`updated_at = NOW()`);
  params.push(userId);
  
  return queryOne<DBUser>(
    `UPDATE users SET ${sets.join(", ")} WHERE id = $${paramIdx}
     RETURNING id, email, display_name, photo_url, is_admin, created_at, updated_at, last_login`,
    params
  );
}

export async function getAllUsers(limit = 100, offset = 0): Promise<DBUser[]> {
  return query<DBUser>(
    `SELECT id, email, display_name, photo_url, is_admin, created_at, updated_at, last_login
     FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
}

export async function getUserCount(): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM users`
  );
  return parseInt(result?.count ?? "0");
}

export async function getActiveUserCount(days = 7): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM users 
     WHERE last_login >= NOW() - INTERVAL '${days} days'`
  );
  return parseInt(result?.count ?? "0");
}

export interface DBUserSubscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  status: string;
  plan: string;
  current_period_start: Date;
  current_period_end: Date;
  created_at: Date;
}

export async function getUserSubscription(userId: string): Promise<DBUserSubscription | null> {
  return queryOne<DBUserSubscription>(
    `SELECT * FROM user_subscriptions 
     WHERE user_id = $1 AND status = 'active'
     ORDER BY created_at DESC LIMIT 1`,
    [userId]
  );
}
