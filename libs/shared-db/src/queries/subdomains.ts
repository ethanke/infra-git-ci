/**
 * Subdomain queries
 */

import { query, queryOne } from "../client.ts";

export interface Subdomain {
  id: number;
  user_id: string;
  subdomain: string;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export async function getSubdomainsByUserId(userId: string): Promise<Subdomain[]> {
  return query<Subdomain>(
    `SELECT * FROM subdomains WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
}

export async function getSubdomainByName(subdomain: string): Promise<Subdomain | null> {
  return queryOne<Subdomain>(
    `SELECT * FROM subdomains WHERE subdomain = $1`,
    [subdomain]
  );
}

export async function isSubdomainAvailable(subdomain: string): Promise<boolean> {
  // Check reserved list
  const reserved = ["www", "api", "app", "admin", "mail", "smtp", "ftp", "ssh", "ns1", "ns2", "cdn", "static"];
  if (reserved.includes(subdomain)) {
    return false;
  }
  
  // Check database
  const existing = await queryOne<{ subdomain: string }>(
    `SELECT subdomain FROM subdomains WHERE subdomain = $1`,
    [subdomain]
  );
  
  return existing === null;
}

export async function createSubdomain(userId: string, subdomain: string): Promise<Subdomain> {
  const result = await queryOne<Subdomain>(
    `INSERT INTO subdomains (user_id, subdomain, is_active)
     VALUES ($1, $2, true)
     RETURNING *`,
    [userId, subdomain]
  );
  return result!;
}

export async function deleteSubdomain(id: number, userId: string): Promise<boolean> {
  const result = await queryOne<{ id: number }>(
    `DELETE FROM subdomains WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  return result !== null;
}

export async function toggleSubdomainActive(id: number, userId: string): Promise<Subdomain | null> {
  return queryOne<Subdomain>(
    `UPDATE subdomains SET is_active = NOT is_active WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId]
  );
}
