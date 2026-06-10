"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Review } from "@/types/database";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

export interface CreateReviewInput {
  product_id: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  order_id?: string | null;
}

export async function createReview(input: CreateReviewInput): Promise<ActionResult<Review>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "You must be logged in to leave a review" };
    }

    if (input.rating < 1 || input.rating > 5) {
      return { success: false, error: "Rating must be between 1 and 5" };
    }

    let isVerifiedPurchase = false;
    if (input.order_id) {
      const { data: order } = await supabase
        .from("orders")
        .select("id, status")
        .eq("id", input.order_id)
        .eq("customer_id", user.id)
        .eq("status", "delivered")
        .maybeSingle();

      isVerifiedPurchase = !!order;
    }

    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        product_id: input.product_id,
        customer_id: user.id,
        order_id: input.order_id ?? null,
        rating: input.rating,
        title: input.title ?? null,
        comment: input.comment ?? null,
        is_verified_purchase: isVerifiedPurchase,
        is_approved: false,
      })
      .select("*, customer:customers(*)")
      .single();

    if (error || !review) {
      return { success: false, error: error?.message || "Failed to create review" };
    }

    return { success: true, data: review as Review };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create review";
    return { success: false, error: message };
  }
}

export async function moderateReview(
  reviewId: string,
  isApproved: boolean
): Promise<ActionResult<Review>> {
  try {
    const supabase = createAdminClient();

    const { data: review, error } = await supabase
      .from("reviews")
      .update({ is_approved: isApproved })
      .eq("id", reviewId)
      .select("*, customer:customers(*)")
      .single();

    if (error || !review) {
      return { success: false, error: error?.message || "Failed to moderate review" };
    }

    return { success: true, data: review as Review };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to moderate review";
    return { success: false, error: message };
  }
}

export async function getProductReviews(
  productId: string,
  approvedOnly = true
): Promise<ActionResult<Review[]>> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("reviews")
      .select("*, customer:customers(*)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (approvedOnly) {
      query = query.eq("is_approved", true);
    }

    const { data, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []) as Review[] };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch reviews";
    return { success: false, error: message };
  }
}
