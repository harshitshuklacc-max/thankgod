"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Address, Customer, Invoice, Order } from "@/types/database";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function getCustomerProfile(): Promise<ActionResult<Customer>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      const { data: created, error: createError } = await supabase
        .from("customers")
        .insert({
          id: user.id,
          full_name: user.user_metadata?.full_name ?? null,
          phone: user.user_metadata?.phone ?? null,
        })
        .select()
        .single();

      if (createError || !created) {
        return { success: false, error: createError?.message || "Failed to create profile" };
      }

      return { success: true, data: created as Customer };
    }

    return { success: true, data: data as Customer };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch profile";
    return { success: false, error: message };
  }
}

export async function updateCustomerProfile(input: {
  full_name?: string;
  phone?: string;
}): Promise<ActionResult<Customer>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("customers")
      .upsert({
        id: user.id,
        full_name: input.full_name ?? null,
        phone: input.phone ?? null,
      })
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Failed to update profile" };
    }

    return { success: true, data: data as Customer };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update profile";
    return { success: false, error: message };
  }
}

export async function getCustomerAddresses(): Promise<ActionResult<Address[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("customer_id", user.id)
      .order("is_default", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as Address[] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch addresses";
    return { success: false, error: message };
  }
}

export async function saveAddress(
  input: Omit<Address, "id" | "customer_id" | "created_at" | "updated_at"> & { id?: string }
): Promise<ActionResult<Address>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    if (input.is_default) {
      await supabase
        .from("addresses")
        .update({ is_default: false })
        .eq("customer_id", user.id);
    }

    const payload = {
      customer_id: user.id,
      label: input.label,
      full_name: input.full_name,
      phone: input.phone,
      address_line1: input.address_line1,
      address_line2: input.address_line2,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      is_default: input.is_default,
    };

    if (input.id) {
      const { data, error } = await supabase
        .from("addresses")
        .update(payload)
        .eq("id", input.id)
        .eq("customer_id", user.id)
        .select()
        .single();

      if (error || !data) {
        return { success: false, error: error?.message || "Failed to update address" };
      }
      return { success: true, data: data as Address };
    }

    const { data, error } = await supabase
      .from("addresses")
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Failed to save address" };
    }

    return { success: true, data: data as Address };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save address";
    return { success: false, error: message };
  }
}

export async function deleteAddress(addressId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", addressId)
      .eq("customer_id", user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete address";
    return { success: false, error: message };
  }
}

export async function getCustomerOrders(): Promise<ActionResult<Order[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as Order[] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch orders";
    return { success: false, error: message };
  }
}

export async function getCustomerInvoices(): Promise<ActionResult<Invoice[]>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const { data: orders } = await supabase
      .from("orders")
      .select("id")
      .eq("customer_id", user.id);

    const orderIds = (orders || []).map((o) => o.id);
    if (!orderIds.length) {
      return { success: true, data: [] };
    }

    const { data, error } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .in("order_id", orderIds)
      .order("created_at", { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as Invoice[] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch invoices";
    return { success: false, error: message };
  }
}

export async function submitContactForm(input: {
  name: string;
  email: string;
  phone?: string;
  message: string;
}): Promise<ActionResult> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase.from("notifications").insert({
      type: "contact",
      title: `Contact from ${input.name}`,
      message: input.message,
      metadata: {
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit form";
    return { success: false, error: message };
  }
}
