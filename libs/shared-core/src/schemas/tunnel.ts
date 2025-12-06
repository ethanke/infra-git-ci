import { z } from "npm:zod@3";

export const TunnelSchema = z.object({
  tunnel_name: z.string(),
  subdomain: z.string().nullable(),
  url: z.string(),
  local_port: z.number().nullable(),
  remote_port: z.number().nullable(),
  proxy_type: z.enum(["http", "https", "tcp", "udp", "stcp", "xtcp"]),
  use_encryption: z.boolean().default(false),
  use_compression: z.boolean().default(false),
  auth_enabled: z.boolean().default(false),
  bandwidth_limit: z.string().nullable(),
  connected_at: z.string().datetime(),
  duration_seconds: z.number().optional(),
});

export type Tunnel = z.infer<typeof TunnelSchema>;

export const TunnelStatsSchema = z.object({
  active_count: z.number(),
  total_bytes_in: z.number(),
  total_bytes_out: z.number(),
  total_sessions: z.number(),
  average_session_seconds: z.number(),
  protocol_stats: z.record(z.object({
    bytes_in: z.number(),
    bytes_out: z.number(),
    sessions: z.number(),
  })),
});

export type TunnelStats = z.infer<typeof TunnelStatsSchema>;
