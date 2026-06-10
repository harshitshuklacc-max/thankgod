import { Suspense } from "react";

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<div className="container mx-auto px-4 py-20 text-center">Loading shop...</div>}>{children}</Suspense>;
}
