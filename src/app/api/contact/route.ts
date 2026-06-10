import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminClient } from "@/lib/supabase/admin";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, phone, subject, message } = parsed.data;
    const supabase = createAdminClient();

    const { data: notification, error: notificationError } = await supabase
      .from("notifications")
      .insert({
        user_id: null,
        type: "contact_form",
        title: `Contact: ${subject}`,
        message: `${name} (${email}${phone ? `, ${phone}` : ""}): ${message}`,
        metadata: {
          name,
          email,
          phone: phone ?? null,
          subject,
          message,
          submitted_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (notificationError) {
      return NextResponse.json(
        { error: "Failed to save contact submission", details: notificationError.message },
        { status: 500 }
      );
    }

    await supabase.from("audit_logs").insert({
      action: "contact_form_submission",
      entity_type: "notification",
      entity_id: notification.id,
      details: { name, email, subject },
      performed_by: email,
    });

    return NextResponse.json({
      success: true,
      message: "Thank you for contacting us. We will get back to you soon.",
      id: notification.id,
    });
  } catch (err) {
    console.error("Contact form error:", err);
    const message = err instanceof Error ? err.message : "Failed to submit contact form";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
