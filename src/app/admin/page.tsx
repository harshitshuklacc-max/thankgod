import Link from "next/link";
import {
  AlertTriangle,
  DollarSign,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  Warehouse,
} from "lucide-react";

import { DashboardCharts } from "@/components/admin/dashboard-charts";
import { DashboardRealtime } from "@/components/admin/dashboard-realtime";
import { StatsCard } from "@/components/admin/stats-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDashboardStats,
  getLowStockAlerts,
  getOrdersChartData,
  getProductsChartData,
  getRevenueChartData,
  getSalesChartData,
} from "@/lib/dashboard";
import { formatCurrency } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [stats, revenueData, ordersData, salesData, productsData, lowStock] =
    await Promise.all([
      getDashboardStats(),
      getRevenueChartData(),
      getOrdersChartData(),
      getSalesChartData(),
      getProductsChartData(),
      getLowStockAlerts(),
    ]);

  return (
    <div className="space-y-8">
      <DashboardRealtime />

      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-zinc-400">Overview of your store performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          accent
        />
        <StatsCard
          title="Inventory Units"
          value={stats.totalInventory}
          icon={Warehouse}
        />
        <StatsCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingCart}
          description={`${stats.onlineOrders} online · ${stats.offlineOrders} offline`}
        />
        <StatsCard
          title="Customers"
          value={stats.totalCustomers}
          icon={Users}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          accent
        />
        <StatsCard
          title="Today"
          value={formatCurrency(stats.todayRevenue)}
          icon={TrendingUp}
        />
        <StatsCard
          title="This Month"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={DollarSign}
        />
        <StatsCard
          title="This Year"
          value={formatCurrency(stats.yearlyRevenue)}
          icon={DollarSign}
        />
      </div>

      <DashboardCharts
        revenueData={revenueData}
        ordersData={ordersData}
        salesData={salesData}
        productsData={productsData}
      />

      <Card className="border-zinc-800 bg-zinc-900/80">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <AlertTriangle className="h-5 w-5 text-[#16A34A]" />
            Low Stock Alerts
            {stats.lowStockCount > 0 && (
              <Badge variant="destructive" className="bg-[#16A34A]">
                {stats.lowStockCount}
              </Badge>
            )}
          </CardTitle>
          <Link
            href="/admin/inventory"
            className="text-sm text-[#16A34A] hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {lowStock.length === 0 ? (
            <p className="text-sm text-zinc-500">All products are well stocked.</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-zinc-100">
                      {item.product?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-zinc-500">
                      SKU: {item.product?.sku ?? "—"} · Barcode:{" "}
                      {item.product?.barcode ?? "—"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#16A34A]">{item.quantity} left</p>
                    <p className="text-xs text-zinc-500">
                      Threshold: {item.low_stock_threshold}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
