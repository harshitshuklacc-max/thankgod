import { OrdersTable } from "@/components/admin/orders-table";
import { getOrders } from "@/actions/orders";

export default async function AdminOrdersPage() {
  const result = await getOrders({ limit: 100 });
  const orders = result.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Orders</h1>
        <p className="mt-1 text-zinc-400">Manage and fulfill customer orders</p>
      </div>
      <OrdersTable orders={orders} />
    </div>
  );
}
