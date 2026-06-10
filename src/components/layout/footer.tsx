import Link from "next/link";
import {
  Clock,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";

import { STORE_INFO } from "@/lib/utils";

const FOOTER_LINKS = {
  shop: [
    { href: "/shop", label: "All Products" },
    { href: "/shop?filter=new-arrivals", label: "New Arrivals" },
    { href: "/shop?filter=featured", label: "Featured" },
    { href: "/shop?filter=best-sellers", label: "Best Sellers" },
  ],
  categories: [
    { href: "/shop?category=mens-shoes", label: "Men's Shoes" },
    { href: "/shop?category=womens-shoes", label: "Women's Shoes" },
    { href: "/shop?category=sports-shoes", label: "Sports Shoes" },
    { href: "/shop?category=sneakers", label: "Sneakers" },
  ],
  company: [
    { href: "/contact", label: "Contact Us" },
    { href: "/admin/login", label: "Admin Login" },
    { href: "/about", label: "About Us" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
  ],
};

const SOCIAL_LINKS = [
  { href: "#", icon: Facebook, label: "Facebook" },
  { href: "#", icon: Instagram, label: "Instagram" },
  { href: "#", icon: Twitter, label: "Twitter" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="inline-block text-2xl font-black tracking-tighter">
              <span className="text-primary">SHOE</span>{" "}
              <span className="text-white">MAFIA</span>
            </Link>
            <p className="text-sm leading-relaxed text-white/70">
              Your trusted destination for premium footwear in Bilaspur.
              Quality shoes for every occasion at unbeatable prices.
            </p>
            <div className="flex gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-primary hover:bg-primary hover:text-white"
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Shop
            </h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Categories
            </h3>
            <ul className="space-y-2.5">
              {FOOTER_LINKS.categories.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-white/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{STORE_INFO.address}</span>
              </li>
              <li>
                <a
                  href={`tel:${STORE_INFO.phone}`}
                  className="flex items-center gap-3 text-sm text-white/70 transition-colors hover:text-primary"
                >
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  {STORE_INFO.phone}
                </a>
              </li>
              <li className="flex items-center gap-3 text-sm text-white/70">
                <Clock className="h-4 w-4 shrink-0 text-primary" />
                {STORE_INFO.hours}
              </li>
              <li>
                <a
                  href={`mailto:info@shoemafia.in`}
                  className="flex items-center gap-3 text-sm text-white/70 transition-colors hover:text-primary"
                >
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  info@shoemafia.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-white/50">
            © {currentYear} {STORE_INFO.name}. All rights reserved.
          </p>
          <div className="flex gap-6">
            {FOOTER_LINKS.company.slice(2).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/50 transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
