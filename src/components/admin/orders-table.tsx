"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { cancelOrder, updateOrderStatus } from "@/actions/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Order, OrderStatus } from "@/types/database";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  packed: "bg-purple-500/20 text-purple-400",
  shipped: "bg-indigo-500/20 text-indigo-400",
  delivered: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

interface OrdersTableProps {
  orders: Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        o.order_number.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_phone?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  async function handleStatus(orderId: string, status: OrderStatus) {
    setLoading(orderId);
    const result = await updateOrderStatus(orderId, status);
    if (result.success) {
      toast.success(`Order ${status}`);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update order");
    }
    setLoading(null);
  }

  async function handleCancel(orderId: string) {
    setLoading(orderId);
    const result = await cancelOrder(orderId);
    if (result.success) {
      toast.success("Order cancelled");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to cancel order");
    }
    setLoading(null);
  }

  function getActions(order: Order) {
    const disabled = loading === order.id;
    const actions: { label: string; status: OrderStatus; variant?: "destructive" }[] = [];

    switch (order.status) {
      case "pending":
        actions.push({ label: "Accept", status: "confirmed" });
        actions.push({ label: "Reject", status: "cancelled", variant: "destructive" });
        break;
      case "confirmed":
        actions.push({ label: "Pack", status: "packed" });
        actions.push({ label: "Cancel", status: "cancelled", variant: "destructive" });
        break;
      case "packed":
        actions.push({ label: "Ship", status: "shipped" });
        break;
      case "shipped":
        actions.push({ label: "Deliver", status: "delivered" });
        break;
    }

    return actions.map((action) => (
      <Button
        key={action.label}
        size="sm"
        variant={action.variant === "destructive" ? "destructive" : "outline"}
        className={
          action.variant !== "destructive"
            ? "border-zinc-700 text-xs"
            : "text-xs"
        }
        disabled={disabled}
        onClick={() =>
          action.status === "cancelled"
            ? handleCancel(order.id)
            : handleStatus(order.id, action.status)
        }
      >
        {action.label}
      </Button>
    ));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <Input
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm border-zinc-700 bg-zinc-800 text-white"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 border-zinc-700 bg-zinc-800 text-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="packed">Packed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-zinc-800">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400">Order</TableHead>
              <TableHead className="text-zinc-400">Customer</TableHead>
              <TableHead className="text-zinc-400">Total</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              <TableHead className="text-zinc-400">Date</TableHead>
              <TableHead className="text-right text-zinc-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-zinc-500">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((order) => (
                <TableRow key={order.id} className="border-zinc-800">
                  <TableCell>
                    <div>
                      <p className="font-medium text-zinc-100">{order.order_number}</p>
                      <p className="text-xs text-zinc-500 capitalize">{order.order_type}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-zinc-300">{order.customer_name ?? "—"}</p>
                    <p className="text-xs text-zinc-500">{order.customer_phone}</p>
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {formatCurrency(order.grand_total)}
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_COLORS[order.status]}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-zinc-400">
                    {formatDateTime(order.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">{getActions(order)}</div>
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
