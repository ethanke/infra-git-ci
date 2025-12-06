/**
 * Shared configuration utilities
 */

export interface AppConfig {
  env: "development" | "production";
  port: number;
  baseUrl: string;
  platformUrl: string;
  sessionSecret: string;
  cookieDomain: string;
}

export function getConfig(): AppConfig {
  const env = (Deno.env.get("ENV") ?? "development") as "development" | "production";
  const port = parseInt(Deno.env.get("PORT") ?? "3000");
  
  return {
    env,
    port,
    baseUrl: Deno.env.get("BASE_URL") ?? `http://localhost:${port}`,
    platformUrl: Deno.env.get("PLATFORM_URL") ?? "https://platform.lum.tools",
    sessionSecret: Deno.env.get("SESSION_SECRET") ?? "dev-secret-change-in-production",
    cookieDomain: env === "production" ? ".lum.tools" : "localhost",
  };
}

export function isDev(): boolean {
  return (Deno.env.get("ENV") ?? "development") === "development";
}

export function isProd(): boolean {
  return Deno.env.get("ENV") === "production";
}
