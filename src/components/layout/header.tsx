"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown,
  Heart,
  LogIn,
  Menu,
  Search,
  Shield,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { useCart } from "@/hooks/use-cart";
import { useWishlist } from "@/hooks/use-wishlist";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/contact", label: "Contact" },
];

const CATEGORY_LINKS = [
  { href: "/shop?category=mens-shoes", label: "Men's Shoes" },
  { href: "/shop?category=womens-shoes", label: "Women's Shoes" },
  { href: "/shop?category=sports-shoes", label: "Sports Shoes" },
  { href: "/shop?category=casual-shoes", label: "Casual Shoes" },
  { href: "/shop?category=sneakers", label: "Sneakers" },
];

export function Header() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { itemCount: cartCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/shop?q=${encodeURIComponent(q)}`);
      setMobileOpen(false);
    }
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled ? "glass shadow-md" : "bg-background/80 backdrop-blur-sm"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4 md:h-20">
          <Link href="/" className="group flex shrink-0 items-center gap-1">
            <motion.span
              whileHover={{ scale: 1.02 }}
              className="text-xl font-black tracking-tighter md:text-2xl"
            >
              <span className="text-primary">SHOE</span>{" "}
              <span className="text-secondary">MAFIA</span>
            </motion.span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
              >
                {link.label}
              </Link>
            ))}

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted hover:text-primary"
                >
                  Categories
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="glass z-50 min-w-[200px] rounded-xl p-2 shadow-xl"
                  sideOffset={8}
                >
                  {CATEGORY_LINKS.map((cat) => (
                    <DropdownMenu.Item key={cat.href} asChild>
                      <Link
                        href={cat.href}
                        className="block cursor-pointer rounded-lg px-3 py-2 text-sm outline-none transition-colors hover:bg-primary/10 hover:text-primary focus:bg-primary/10"
                      >
                        {cat.label}
                      </Link>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </nav>

          <form
            onSubmit={handleSearch}
            className="hidden max-w-xs flex-1 items-center md:flex lg:max-w-sm"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search shoes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-border bg-muted/50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </form>

          <div className="flex items-center gap-1 md:gap-2">
            <Link
              href="/account?tab=wishlist"
              className="relative hidden rounded-full p-2.5 text-foreground transition-colors hover:bg-muted hover:text-primary sm:flex"
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/cart"
              className="relative rounded-full p-2.5 text-foreground transition-colors hover:bg-muted hover:text-primary"
              aria-label="Cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="hidden rounded-full p-2.5 text-foreground transition-colors hover:bg-muted hover:text-primary md:flex"
                  aria-label="Account"
                >
                  <User className="h-5 w-5" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="glass z-50 min-w-[180px] rounded-xl p-2 shadow-xl"
                  sideOffset={8}
                  align="end"
                >
                  {userEmail ? (
                    <>
                      <DropdownMenu.Label className="px-3 py-2 text-xs text-muted-foreground">
                        {userEmail}
                      </DropdownMenu.Label>
                      <DropdownMenu.Separator className="my-1 h-px bg-border" />
                      <DropdownMenu.Item asChild>
                        <Link
                          href="/account"
                          className="block cursor-pointer rounded-lg px-3 py-2 text-sm outline-none hover:bg-primary/10 hover:text-primary"
                        >
                          My Profile
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <Link
                          href="/account/orders"
                          className="block cursor-pointer rounded-lg px-3 py-2 text-sm outline-none hover:bg-primary/10 hover:text-primary"
                        >
                          My Orders
                        </Link>
                      </DropdownMenu.Item>
                    </>
                  ) : (
                    <>
                      <DropdownMenu.Item asChild>
                        <Link
                          href="/auth/login"
                          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none hover:bg-primary/10 hover:text-primary"
                        >
                          <LogIn className="h-4 w-4" />
                          Login
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <Link
                          href="/auth/register"
                          className="block cursor-pointer rounded-lg px-3 py-2 text-sm outline-none hover:bg-primary/10 hover:text-primary"
                        >
                          Register
                        </Link>
                      </DropdownMenu.Item>
                    </>
                  )}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>

            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-2 text-xs font-semibold text-primary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground sm:px-3"
              aria-label="Admin Login"
            >
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <span className="hidden sm:inline">Admin</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="rounded-full p-2.5 text-foreground transition-colors hover:bg-muted lg:hidden"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border lg:hidden"
          >
            <div className="container space-y-4 px-4 py-4">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    placeholder="Search shoes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-full border border-border bg-muted/50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
                  />
                </div>
              </form>

              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                ))}
                <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Categories
                </p>
                {CATEGORY_LINKS.map((cat) => (
                  <Link
                    key={cat.href}
                    href={cat.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                  >
                    {cat.label}
                  </Link>
                ))}
              </nav>

              <div className="flex gap-2 border-t border-border pt-4">
                <Link
                  href="/account?tab=wishlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium"
                >
                  <Heart className="h-4 w-4" />
                  Wishlist
                  {wishlistCount > 0 && ` (${wishlistCount})`}
                </Link>
                <Link
                  href={userEmail ? "/account" : "/auth/login"}
                  onClick={() => setMobileOpen(false)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground"
                >
                  <User className="h-4 w-4" />
                  {userEmail ? "Profile" : "Login"}
                </Link>
              </div>

              <Link
                href="/admin/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border py-2.5 text-sm font-medium text-muted-foreground"
              >
                <Shield className="h-4 w-4" />
                Admin Login
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
