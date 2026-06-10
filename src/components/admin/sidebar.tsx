"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Barcode,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingCart,
  Star,
  Upload,
  Users,
  Warehouse,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";

import { adminLogout } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Warehouse },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/pos", label: "POS", icon: Monitor },
  { href: "/admin/busy-import", label: "Busy Import", icon: Upload },
  { href: "/admin/barcodes", label: "Barcodes", icon: Barcode },
  { href: "/admin/invoices", label: "Invoices", icon: FileText },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/danger-zone", label: "Danger Zone", icon: AlertTriangle },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const result = await adminLogout();
    if (result.success) {
      toast.success("Logged out");
      router.push("/admin/login");
      router.refresh();
    } else {
      toast.error(result.error || "Logout failed");
    }
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 px-6 py-5">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-white">
            SHOE<span className="text-[#16A34A]">MAFIA</span>
          </span>
        </Link>
        <p className="mt-1 text-xs text-zinc-500">Admin Portal</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[#16A34A]/15 text-[#16A34A]"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                item.href === "/admin/danger-zone" &&
                  !isActive &&
                  "text-red-400/70 hover:text-red-400"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-zinc-800 p-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-zinc-400 hover:bg-zinc-900 hover:text-[#16A34A]"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}

interface AdminShellProps {
  children: React.ReactNode;
}

export function AdminShell({ children }: AdminShellProps) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-zinc-950">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-zinc-950">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
