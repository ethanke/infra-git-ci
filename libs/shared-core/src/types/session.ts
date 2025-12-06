import type { SessionUser } from "../schemas/user.ts";

export interface SessionContext {
  Variables: {
    user: SessionUser | null;
    sessionCookie: string;
  };
}

export interface SessionData {
  user_id: string;
  user_email: string;
  user_display_name: string | null;
  user_photo_url: string | null;
  is_admin: boolean;
}
