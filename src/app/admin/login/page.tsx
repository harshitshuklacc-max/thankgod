"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Lock, User } from "lucide-react";
import { toast } from "sonner";

import { adminLogin, getAdminEnvStatus } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [envWarning, setEnvWarning] = useState<string | null>(null);

  useEffect(() => {
    getAdminEnvStatus().then((result) => {
      if (result.success && result.data && !result.data.configured) {
        setEnvWarning(
          `Missing env vars: ${result.data.missing.join(", ")}. For local dev, add them to .env.local in the project root. For Vercel, add them in Settings → Environment Variables, then redeploy.`
        );
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const result = await adminLogin(username, password);

    if (result.success) {
      toast.success("Welcome back!");
      router.push("/admin");
      router.refresh();
    } else {
      toast.error(result.error || "Login failed");
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <Card className="w-full max-w-md border-zinc-800 bg-zinc-900/90">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-black text-white">
            SHOE<span className="text-[#16A34A]">MAFIA</span>
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Sign in to the admin portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {envWarning && (
            <div className="mb-4 flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{envWarning}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-zinc-300">
                Username
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-zinc-700 bg-zinc-800 pl-10 text-white"
                  placeholder="admin"
                  required
                  autoComplete="username"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-zinc-700 bg-zinc-800 pl-10 text-white"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-[#16A34A] hover:bg-[#16A34A]/90"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
