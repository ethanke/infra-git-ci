import { z } from "npm:zod@3";

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  display_name: z.string().nullable(),
  photo_url: z.string().url().nullable(),
  is_admin: z.boolean().default(false),
  created_at: z.string().datetime(),
  last_login: z.string().datetime().nullable(),
});

export type User = z.infer<typeof UserSchema>;

export const SessionUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  display_name: z.string().nullable(),
  photo_url: z.string().url().nullable().optional(),
  is_admin: z.boolean().default(false),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;

export const UserSubscriptionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  stripe_subscription_id: z.string(),
  status: z.enum(["active", "canceled", "past_due", "trialing"]),
  plan: z.string(),
  current_period_start: z.string().datetime(),
  current_period_end: z.string().datetime(),
  created_at: z.string().datetime(),
});

export type UserSubscription = z.infer<typeof UserSubscriptionSchema>;
