import { ContactSection } from "@/components/home/contact-section";
import { HeroSection } from "@/components/home/hero-section";
import { ProductSection } from "@/components/home/product-section";
import { ReviewsSection } from "@/components/home/reviews-section";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import {
  fetchApprovedReviews,
  fetchProductsByCategorySlug,
  fetchProductsByFlag,
} from "@/lib/products";

const CATEGORY_SECTIONS = [
  { slug: "mens-shoes", title: "Men's Collection", subtitle: "Bold styles for the modern man" },
  { slug: "womens-shoes", title: "Women's Collection", subtitle: "Elegant footwear for every occasion" },
  { slug: "sports-shoes", title: "Sports Shoes", subtitle: "Performance footwear for active lifestyles" },
  { slug: "casual-shoes", title: "Casual Shoes", subtitle: "Comfortable everyday essentials" },
  { slug: "sneakers", title: "Sneakers", subtitle: "Trendy kicks for street style" },
] as const;

export default async function HomePage() {
  const [
    newArrivals,
    featured,
    trending,
    bestSellers,
    reviews,
    mensProducts,
    womensProducts,
    sportsProducts,
    casualProducts,
    sneakersProducts,
  ] = await Promise.all([
    fetchProductsByFlag("is_new_arrival"),
    fetchProductsByFlag("is_featured"),
    fetchProductsByFlag("is_trending"),
    fetchProductsByFlag("is_best_seller"),
    fetchApprovedReviews(),
    fetchProductsByCategorySlug("mens-shoes"),
    fetchProductsByCategorySlug("womens-shoes"),
    fetchProductsByCategorySlug("sports-shoes"),
    fetchProductsByCategorySlug("casual-shoes"),
    fetchProductsByCategorySlug("sneakers"),
  ]);

  const categoryProducts = [
    mensProducts,
    womensProducts,
    sportsProducts,
    casualProducts,
    sneakersProducts,
  ];

  return (
    <>
      <HeroSection />

      <ProductSection
        title="New Arrivals"
        subtitle="Fresh styles just landed — be the first to step into the latest trends"
        products={newArrivals}
        viewAllHref="/shop?filter=new-arrivals"
      />

      <div className="bg-muted/30">
        <ProductSection
          title="Featured Collection"
          subtitle="Handpicked favorites our customers love"
          products={featured}
          viewAllHref="/shop?filter=featured"
        />
      </div>

      <ProductSection
        title="Trending Now"
        subtitle="What's hot right now in footwear fashion"
        products={trending}
        viewAllHref="/shop?filter=trending"
      />

      {CATEGORY_SECTIONS.map((section, index) => (
        <div key={section.slug} className={index % 2 === 1 ? "bg-muted/30" : undefined}>
          <ProductSection
            title={section.title}
            subtitle={section.subtitle}
            products={categoryProducts[index]}
            viewAllHref={`/shop?category=${section.slug}`}
          />
        </div>
      ))}

      <div className="bg-muted/30">
        <ProductSection
          title="Best Sellers"
          subtitle="Top-rated shoes flying off our shelves"
          products={bestSellers}
          viewAllHref="/shop?filter=best-sellers"
        />
      </div>

      <WhyChooseUs />
      <ReviewsSection reviews={reviews} />
      <ContactSection />
    </>
  );
}
