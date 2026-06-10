import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import { CartProvider } from "@/components/cart/cart-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { STORE_INFO } from "@/lib/utils";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shoemafia.in";

export const metadata: Metadata = {
  title: {
    default: STORE_INFO.name,
    template: `%s | ${STORE_INFO.name}`,
  },
  description:
    "Premium footwear destination in Bilaspur. Shop men's, women's, sports, casual shoes and sneakers at SHOE MAFIA.",
  keywords: [
    "shoes",
    "sneakers",
    "footwear",
    "Bilaspur",
    "SHOE MAFIA",
    "men's shoes",
    "women's shoes",
  ],
  authors: [{ name: STORE_INFO.name }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: STORE_INFO.name,
    title: STORE_INFO.name,
    description:
      "Premium footwear destination in Bilaspur. Discover the latest arrivals, trending styles, and best sellers.",
  },
  twitter: {
    card: "summary_large_image",
    title: STORE_INFO.name,
    description:
      "Premium footwear destination in Bilaspur. Shop the latest shoes and sneakers.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.svg",
    apple: "/icons/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: STORE_INFO.name,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <CartProvider>{children}</CartProvider>
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              classNames: {
                toast: "glass border-border",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
