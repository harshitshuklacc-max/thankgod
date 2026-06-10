"use client";

import { motion } from "framer-motion";
import {
  Award,
  Headphones,
  RefreshCw,
  ShieldCheck,
  Truck,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: Award,
    title: "Premium Quality",
    description:
      "Handpicked footwear from trusted brands, ensuring durability and comfort with every step.",
  },
  {
    icon: Zap,
    title: "Latest Trends",
    description:
      "Stay ahead with our constantly updated collection of trending styles and new arrivals.",
  },
  {
    icon: ShieldCheck,
    title: "Authentic Products",
    description:
      "100% genuine products with quality assurance. No compromises on authenticity.",
  },
  {
    icon: Truck,
    title: "Fast Delivery",
    description:
      "Quick and reliable delivery across Bilaspur and surrounding areas.",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description:
      "Hassle-free return policy so you can shop with complete confidence.",
  },
  {
    icon: Headphones,
    title: "Expert Support",
    description:
      "Our friendly team is always ready to help you find the perfect pair.",
  },
];

export function WhyChooseUs() {
  return (
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            Why Choose <span className="text-primary">SHOE MAFIA</span>
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">
            We&apos;re more than just a shoe store — we&apos;re your style
            partners committed to delivering the best footwear experience.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="group rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
