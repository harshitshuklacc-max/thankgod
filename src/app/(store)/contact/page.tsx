"use client";

import { motion } from "framer-motion";
import {
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { submitContactForm } from "@/actions/customer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { STORE_INFO } from "@/lib/utils";

const MAP_EMBED_URL =
  "https://maps.google.com/maps?q=Bus+Stand+Old+Telephone+Exchange+Road+Telipara+Bilaspur+Chhattisgarh+495001&output=embed";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const result = await submitContactForm(form);
    setSubmitting(false);

    if (result.success) {
      toast.success("Message sent! We'll get back to you soon.");
      setForm({ name: "", email: "", phone: "", message: "" });
    } else {
      toast.error(result.error || "Failed to send message");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h1 className="text-3xl font-black tracking-tight md:text-4xl">
          Contact <span className="text-primary">Us</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          We&apos;d love to hear from you. Visit our store or send us a message.
        </p>
      </motion.div>

      <div className="grid gap-10 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="space-y-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Store Address</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {STORE_INFO.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Phone</h3>
                  <a
                    href={`tel:${STORE_INFO.phone}`}
                    className="mt-1 block text-sm text-muted-foreground hover:text-primary"
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
                  <h3 className="font-semibold">Store Hours</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {STORE_INFO.hours}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Rating</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {STORE_INFO.rating} ★ on Google
                  </p>
                </div>
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
              WhatsApp Us
            </a>
            <a
              href={`tel:${STORE_INFO.phone}`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-bold transition-all hover:border-primary hover:text-primary"
            >
              <Phone className="h-5 w-5" />
              Call Now
            </a>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border shadow-lg">
            <iframe
              title={`${STORE_INFO.name} location`}
              src={MAP_EMBED_URL}
              width="100%"
              height="320"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full grayscale-[20%] transition-all hover:grayscale-0"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-border bg-card p-6 shadow-sm"
          >
            <h2 className="mb-6 text-xl font-bold">Send a Message</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
