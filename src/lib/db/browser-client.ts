import type { AuthUser } from "./auth-types";

type AuthCallback = (
  event: string,
  session: { user: AuthUser | null } | null
) => void;

const authListeners = new Set<AuthCallback>();

function notifyAuthListeners(event: string, user: AuthUser | null) {
  const session = user ? { user } : null;
  for (const cb of authListeners) cb(event, session);
}

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

/** Browser-safe client — no server-only imports */
export function createBrowserClient() {
  const channels: RealtimeChannel[] = [];

  return {
    auth: {
      async getUser() {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return { data: { user: null }, error: null };
        const json = await res.json();
        return { data: { user: json.user ?? null }, error: null };
      },

      async signUp(input: {
        email: string;
        password: string;
        options?: { emailRedirectTo?: string; data?: Record<string, unknown> };
      }) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: input.email,
            password: input.password,
            metadata: input.options?.data,
          }),
        });
        const json = await res.json();
        if (!res.ok) return { data: { user: null, session: null }, error: json.error };
        notifyAuthListeners("SIGNED_IN", json.user);
        return { data: { user: json.user, session: { user: json.user } }, error: null };
      },

      async signInWithPassword(input: { email: string; password: string }) {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const json = await res.json();
        if (!res.ok) return { data: { user: null, session: null }, error: json.error };
        notifyAuthListeners("SIGNED_IN", json.user);
        return { data: { user: json.user, session: { user: json.user } }, error: null };
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
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        notifyAuthListeners("SIGNED_OUT", null);
        return { error: null };
      },

      onAuthStateChange(callback: AuthCallback) {
        authListeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe: () => authListeners.delete(callback),
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
