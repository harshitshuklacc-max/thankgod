"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Shield, Sparkles } from "lucide-react";

import { STORE_INFO } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent" />
      <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="container relative mx-auto px-4 py-24 md:py-32 lg:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Premium Footwear in Bilaspur</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl font-black leading-none tracking-tighter md:text-7xl lg:text-8xl"
          >
            <span className="text-primary">SHOE</span>{" "}
            <span className="text-white">MAFIA</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-white/70 md:text-xl"
          >
            Step into style with curated collections of men&apos;s, women&apos;s,
            sports, and casual footwear. Quality you can trust, prices you&apos;ll
            love.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/40"
            >
              Shop Now
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/shop?filter=new-arrivals"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              New Arrivals
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-primary/10 px-8 py-4 text-base font-semibold text-primary backdrop-blur-sm transition-all hover:bg-primary hover:text-primary-foreground"
            >
              <Shield className="h-5 w-5" />
              Admin Login
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-white/60"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">
                {STORE_INFO.rating}
              </span>
              <span>★ Google Rating</span>
            </div>
            <div className="hidden h-4 w-px bg-white/20 sm:block" />
            <span>{STORE_INFO.hours}</span>
            <div className="hidden h-4 w-px bg-white/20 sm:block" />
            <span>Bilaspur, Chhattisgarh</span>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
