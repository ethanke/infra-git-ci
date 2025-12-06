/**
 * PostgreSQL Database Client
 */

import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

let pool: Pool | null = null;

export interface DBConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  poolSize?: number;
}

export function getDBConfig(): DBConfig {
  return {
    host: Deno.env.get("POSTGRES_HOST") ?? "localhost",
    port: parseInt(Deno.env.get("POSTGRES_PORT") ?? "5432"),
    database: Deno.env.get("POSTGRES_DB") ?? "lum_platform",
    user: Deno.env.get("POSTGRES_USER") ?? "postgres",
    password: Deno.env.get("POSTGRES_PASSWORD") ?? "",
    poolSize: parseInt(Deno.env.get("DB_POOL_SIZE") ?? "10"),
  };
}

export function getPool(): Pool {
  if (!pool) {
    const config = getDBConfig();
    pool = new Pool({
      hostname: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
    }, config.poolSize ?? 10);
  }
  return pool;
}

export async function query<T>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  const client = await getPool().connect();
  try {
    const result = await client.queryObject<T>(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

export async function queryOne<T>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(
  sql: string,
  params?: unknown[]
): Promise<number> {
  const client = await getPool().connect();
  try {
    const result = await client.queryObject(sql, params);
    return result.rowCount ?? 0;
  } finally {
    client.release();
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
