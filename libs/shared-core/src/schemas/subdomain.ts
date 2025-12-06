import { z } from "npm:zod@3";

export const ReservedSubdomainSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  subdomain: z.string(),
  domain: z.string().default("t.lum.tools"),
  is_active: z.boolean().default(false),
  created_at: z.string().datetime(),
});

export type ReservedSubdomain = z.infer<typeof ReservedSubdomainSchema>;

export const SubdomainRequestSchema = z.object({
  subdomain: z.string()
    .min(1)
    .max(63)
    .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/, "Invalid subdomain format"),
});

export type SubdomainRequest = z.infer<typeof SubdomainRequestSchema>;
