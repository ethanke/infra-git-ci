import { z } from "npm:zod@3";

export const APIKeySchema = z.object({
  id: z.number(),
  user_id: z.string(),
  name: z.string(),
  prefix: z.string(),
  is_active: z.boolean().default(true),
  created_at: z.string().datetime(),
  last_used_at: z.string().datetime().nullable(),
  expires_at: z.string().datetime().nullable(),
});

export type APIKey = z.infer<typeof APIKeySchema>;

export const CreateAPIKeyRequestSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
});

export type CreateAPIKeyRequest = z.infer<typeof CreateAPIKeyRequestSchema>;

export const APIKeyResponseSchema = z.object({
  success: z.boolean(),
  key: z.string().optional(),
  id: z.number().optional(),
  name: z.string().optional(),
  prefix: z.string().optional(),
  created_at: z.string().optional(),
  message: z.string().optional(),
});

export type APIKeyResponse = z.infer<typeof APIKeyResponseSchema>;
