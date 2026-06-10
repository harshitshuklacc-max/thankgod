"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, MessageCircle, Phone } from "lucide-react";

import { STORE_INFO } from "@/lib/utils";

const MAP_EMBED_URL =
  "https://maps.google.com/maps?q=Bus+Stand+Old+Telephone+Exchange+Road+Telipara+Bilaspur+Chhattisgarh+495001&output=embed";

export function ContactSection() {
  return (
    <section className="bg-secondary py-16 text-secondary-foreground md:py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-10 text-center"
        >
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            Visit Our Store
          </h2>
          <p className="mt-2 text-white/70">
            Come experience our collection in person at {STORE_INFO.name}
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Address</h3>
                  <p className="mt-1 text-sm text-white/70">
                    {STORE_INFO.address}
                  </p>
                </div>
              </div>

              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Phone</h3>
                  <a
                    href={`tel:${STORE_INFO.phone}`}
                    className="mt-1 block text-sm text-white/70 transition-colors hover:text-primary"
                  >
                    {STORE_INFO.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Store Hours</h3>
                  <p className="mt-1 text-sm text-white/70">
                    {STORE_INFO.hours}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={`https://wa.me/${STORE_INFO.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 text-sm font-bold text-white transition-transform hover:scale-105"
              >
                <MessageCircle className="h-5 w-5" />
                Chat on WhatsApp
              </a>
              <a
                href={`tel:${STORE_INFO.phone}`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <Phone className="h-5 w-5" />
                Call Now
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="overflow-hidden rounded-2xl border border-white/10 shadow-xl"
          >
            <iframe
              title={`${STORE_INFO.name} location`}
              src={MAP_EMBED_URL}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 320 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full min-h-[320px] w-full grayscale-[30%] transition-all hover:grayscale-0"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
