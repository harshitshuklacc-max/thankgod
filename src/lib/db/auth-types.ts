export const CUSTOMER_SESSION_COOKIE = "shoe_mafia_customer_session";

export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
}
