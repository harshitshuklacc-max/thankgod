"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";

import { moderateReview } from "@/actions/reviews";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/utils";
import type { Review } from "@/types/database";

interface ReviewsTableProps {
  reviews: Review[];
}

export function ReviewsTable({ reviews }: ReviewsTableProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleModerate(reviewId: string, approved: boolean) {
    setLoading(reviewId);
    const result = await moderateReview(reviewId, approved);
    if (result.success) {
      toast.success(approved ? "Review approved" : "Review rejected");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to moderate review");
    }
    setLoading(null);
  }

  const pending = reviews.filter((r) => !r.is_approved);

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="bg-[#16A34A]">
            {pending.length} pending
          </Badge>
        </div>
      )}

      <div className="rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Customer</TableHead>
              <TableHead className="text-zinc-400">Rating</TableHead>
              <TableHead className="text-zinc-400">Review</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Date</TableHead>
              <TableHead className="text-right text-zinc-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-zinc-500">
                  No reviews yet
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((review) => (
                <TableRow key={review.id} className="border-zinc-800">
                  <TableCell className="text-zinc-300">
                    {review.customer?.full_name ?? "Anonymous"}
                  </TableCell>
                  <TableCell>
                    <span className="text-yellow-400">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div>
                      {review.title && (
                        <p className="font-medium text-zinc-100">{review.title}</p>
                      )}
                      <p className="text-sm text-zinc-400">{review.comment}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        review.is_approved
                          ? "bg-green-600"
                          : "bg-yellow-600"
                      }
                    >
                      {review.is_approved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400">
                    {formatDateTime(review.created_at)}
                  </TableCell>
                  <TableCell>
                    {!review.is_approved && (
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          disabled={loading === review.id}
                          onClick={() => handleModerate(review.id, true)}
                        >
                          <Check className="h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="bg-[#16A34A]"
                          disabled={loading === review.id}
                          onClick={() => handleModerate(review.id, false)}
                        >
                          <X className="h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
