import "server-only";

import * as query from "./query-builder";
import {
  clearSessionCookie,
  createSessionToken,
  getUserFromCookies,
  setSessionCookie,
  signInWithPassword,
  signUpWithPassword,
  type AuthUser,
} from "./auth-session";
import { storage } from "./storage";

type AuthCallback = (
  event: string,
  session: { user: AuthUser | null } | null
) => void;

class RealtimeChannel {
  private interval: ReturnType<typeof setInterval> | null = null;

  on(_event: string, _filter: Record<string, string>, callback?: () => void) {
    if (callback) {
      this.interval = setInterval(callback, 30000);
    }
    return this;
  }

  subscribe() {
    return this;
  }

  unsubscribe() {
    if (this.interval) clearInterval(this.interval);
  }
}

/** Server-only database client */
export function createServerClient() {
  const channels: RealtimeChannel[] = [];

  return {
    from: query.from,
    rpc: query.rpc,
    storage,
    auth: {
      async getUser() {
        const user = await getUserFromCookies();
        return { data: { user }, error: null };
      },

      async signUp(input: {
        email: string;
        password: string;
        options?: { emailRedirectTo?: string; data?: Record<string, unknown> };
      }) {
        const { user, error } = await signUpWithPassword({
          email: input.email,
          password: input.password,
          metadata: input.options?.data,
        });
        if (error || !user) return { data: { user: null, session: null }, error };
        const token = await createSessionToken(user);
        await setSessionCookie(token);
        return { data: { user, session: { user } }, error: null };
      },

      async signInWithPassword(input: { email: string; password: string }) {
        const { user, error } = await signInWithPassword(input);
        if (error || !user) return { data: { user: null, session: null }, error };
        const token = await createSessionToken(user);
        await setSessionCookie(token);
        return { data: { user, session: { user } }, error: null };
      },

      async signInWithOAuth() {
        return {
          data: { url: null },
          error: { message: "Google sign-in is not configured. Use email/password." },
        };
      },

      async resetPasswordForEmail() {
        return {
          data: {},
          error: { message: "Password reset is not configured yet. Contact support." },
        };
      },

      async exchangeCodeForSession() {
        return { data: { session: null }, error: { message: "OAuth is not configured" } };
      },

      async signOut() {
        await clearSessionCookie();
        return { error: null };
      },

      onAuthStateChange(_callback: AuthCallback) {
        return {
          data: {
            subscription: {
              unsubscribe: () => undefined,
            },
          },
        };
      },
    },
    channel(_name: string) {
      const ch = new RealtimeChannel();
      channels.push(ch);
      return ch;
    },
    removeChannel(channel: RealtimeChannel) {
      channel.unsubscribe();
      const idx = channels.indexOf(channel);
      if (idx >= 0) channels.splice(idx, 1);
    },
  };
}
