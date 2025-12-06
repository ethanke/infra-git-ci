/**
 * API Key queries
 */

import { query, queryOne, execute } from "../client.ts";
import { crypto } from "https://deno.land/std@0.224.0/crypto/crypto.ts";
import { encodeHex } from "https://deno.land/std@0.224.0/encoding/hex.ts";

export interface DBAPIKey {
  id: number;
  user_id: string;
  name: string;
  key_hash: string;
  prefix: string;
  encrypted_key: string | null;
  is_active: boolean;
  created_at: Date;
  last_used_at: Date | null;
  expires_at: Date | null;
}

export async function getAPIKeysByUserId(userId: string): Promise<DBAPIKey[]> {
  return query<DBAPIKey>(
    `SELECT id, user_id, name, prefix, is_active, created_at, last_used_at, expires_at
     FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
}

export async function getAPIKeyById(id: number, userId: string): Promise<DBAPIKey | null> {
  return queryOne<DBAPIKey>(
    `SELECT * FROM api_keys WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
}

export function generateAPIKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const key = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  return `lum_${key}`;
}

export async function hashAPIKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return encodeHex(new Uint8Array(hashBuffer));
}

export function getAPIKeyPrefix(key: string): string {
  return key.substring(0, 12);
}

export async function createAPIKey(
  userId: string,
  name: string,
  encryptedKey: string,
  keyHash: string,
  prefix: string
): Promise<DBAPIKey> {
  const result = await queryOne<DBAPIKey>(
    `INSERT INTO api_keys (user_id, name, key_hash, prefix, encrypted_key)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [userId, name, keyHash, prefix, encryptedKey]
  );
  return result!;
}

export async function deleteAPIKey(id: number, userId: string): Promise<boolean> {
  const count = await execute(
    `DELETE FROM api_keys WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return count > 0;
}

export async function toggleAPIKey(id: number, userId: string): Promise<DBAPIKey | null> {
  return queryOne<DBAPIKey>(
    `UPDATE api_keys SET is_active = NOT is_active
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [id, userId]
  );
}

export async function verifyAPIKey(key: string): Promise<{ user_id: string; key_id: number } | null> {
  const prefix = getAPIKeyPrefix(key);
  const hash = await hashAPIKey(key);
  
  const result = await queryOne<{ user_id: string; id: number }>(
    `SELECT user_id, id FROM api_keys 
     WHERE prefix = $1 AND key_hash = $2 AND is_active = true
     AND (expires_at IS NULL OR expires_at > NOW())`,
    [prefix, hash]
  );
  
  if (result) {
    // Update last_used_at
    await execute(
      `UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`,
      [result.id]
    );
  }
  
  return result ? { user_id: result.user_id, key_id: result.id } : null;
}

export async function getAPIKeyCount(userId?: string): Promise<number> {
  if (userId) {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM api_keys WHERE user_id = $1`,
      [userId]
    );
    return parseInt(result?.count ?? "0");
  }
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM api_keys`
  );
  return parseInt(result?.count ?? "0");
}

export async function getActiveAPIKeyCount(): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM api_keys WHERE is_active = true`
  );
  return parseInt(result?.count ?? "0");
}
