import { calculateDiscountedPrice, STORE_INFO } from "@/lib/utils";
import type { Category, Product } from "@/types/database";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://shoemafia.in";

interface JsonLdScriptProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

function JsonLdScript({ data }: JsonLdScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function StoreJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ShoeStore",
    name: STORE_INFO.name,
    description:
      "Premium footwear destination in Bilaspur. Shop men's, women's, sports, casual shoes and sneakers.",
    url: siteUrl,
    telephone: STORE_INFO.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress:
        "Bus Stand, Old Telephone Exchange Road, Telipara",
      addressLocality: "Bilaspur",
      addressRegion: "Chhattisgarh",
      postalCode: "495001",
      addressCountry: "IN",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      closes: "23:00",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: STORE_INFO.rating,
      reviewCount: 100,
    },
    priceRange: "₹₹",
    image: `${siteUrl}/icons/icon-512.png`,
  };

  return <JsonLdScript data={data} />;
}

interface ProductJsonLdProps {
  product: Product;
  category?: Category | null;
}

export function ProductJsonLd({ product, category }: ProductJsonLdProps) {
  const price = calculateDiscountedPrice(
    product.selling_price,
    product.discount_percent
  );
  const primaryImage = product.images?.find((img) => img.is_primary)?.image_url
    ?? product.images?.[0]?.image_url;

  const data = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? `${product.name} — available at ${STORE_INFO.name}`,
    sku: product.sku ?? undefined,
    gtin13: product.barcode_type === "ean13" ? product.barcode : undefined,
    brand: product.brand
      ? { "@type": "Brand", name: product.brand }
      : { "@type": "Brand", name: STORE_INFO.name },
    category: category?.name,
    color: product.color ?? undefined,
    image: primaryImage ? [primaryImage] : undefined,
    url: `${siteUrl}/products/${product.id}`,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/products/${product.id}`,
      priceCurrency: "INR",
      price: price,
      availability:
        (product.inventory?.quantity ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: STORE_INFO.name,
      },
    },
  };

  return <JsonLdScript data={data} />;
}

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.href.startsWith("http") ? item.href : `${siteUrl}${item.href}`,
    })),
  };

  return <JsonLdScript data={data} />;
}
