import { ReviewsTable } from "@/components/admin/reviews-table";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Review } from "@/types/database";

export default async function AdminReviewsPage() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, customer:customers(*)")
    .order("created_at", { ascending: false });

  const reviews = (data ?? []) as Review[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Reviews</h1>
        <p className="mt-1 text-zinc-400">Moderate customer product reviews</p>
      </div>
      <ReviewsTable reviews={reviews} />
    </div>
  );
}
