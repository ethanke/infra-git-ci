import { z } from "npm:zod@3";

export const ActivityLogSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  action: z.string(),
  resource: z.string().nullable(),
  status: z.enum(["success", "error", "pending"]),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  extra_data: z.record(z.unknown()).nullable(),
  created_at: z.string().datetime(),
});

export type ActivityLog = z.infer<typeof ActivityLogSchema>;

export const ActivityStreamSchema = z.object({
  activities: z.array(ActivityLogSchema.extend({
    user_email: z.string().nullable(),
    user_name: z.string().nullable(),
  })),
  last_updated: z.string().datetime(),
});

export type ActivityStream = z.infer<typeof ActivityStreamSchema>;
