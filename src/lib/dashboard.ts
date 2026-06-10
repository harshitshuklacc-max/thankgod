import { createAdminClient } from "@/lib/supabase/admin";
import type { DashboardStats } from "@/types/database";

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface LowStockItem {
  id: string;
  quantity: number;
  low_stock_threshold: number;
  product: {
    id: string;
    name: string;
    sku: string | null;
    barcode: string | null;
  } | null;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfYear(date: Date): Date {
  return new Date(date.getFullYear(), 0, 1);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createAdminClient();
  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const monthStart = startOfMonth(now).toISOString();
  const yearStart = startOfYear(now).toISOString();

  const [
    productsRes,
    inventoryRes,
    ordersRes,
    customersRes,
    allOrdersRes,
    lowStockRes,
  ] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("inventory").select("quantity"),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("customers").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("grand_total, order_type, created_at, status")
      .neq("status", "cancelled"),
    supabase
      .from("inventory")
      .select("id", { count: "exact", head: true })
      .filter("quantity", "lte", "low_stock_threshold"),
  ]);

  const totalInventory =
    inventoryRes.data?.reduce((sum, row) => sum + (row.quantity ?? 0), 0) ?? 0;

  const orders = allOrdersRes.data ?? [];
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.grand_total), 0);
  const todayRevenue = orders
    .filter((o) => o.created_at >= todayStart)
    .reduce((sum, o) => sum + Number(o.grand_total), 0);
  const monthlyRevenue = orders
    .filter((o) => o.created_at >= monthStart)
    .reduce((sum, o) => sum + Number(o.grand_total), 0);
  const yearlyRevenue = orders
    .filter((o) => o.created_at >= yearStart)
    .reduce((sum, o) => sum + Number(o.grand_total), 0);

  const onlineOrders = orders.filter((o) => o.order_type === "online").length;
  const offlineOrders = orders.filter((o) => o.order_type === "offline").length;

  return {
    totalProducts: productsRes.count ?? 0,
    totalInventory,
    totalOrders: ordersRes.count ?? 0,
    totalCustomers: customersRes.count ?? 0,
    totalRevenue,
    todayRevenue,
    monthlyRevenue,
    yearlyRevenue,
    onlineOrders,
    offlineOrders,
    lowStockCount: lowStockRes.count ?? 0,
  };
}

export async function getRevenueChartData(): Promise<ChartDataPoint[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("grand_total, created_at")
    .neq("status", "cancelled")
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order("created_at", { ascending: true });

  const buckets = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const order of data ?? []) {
    const key = order.created_at.slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + Number(order.grand_total));
    }
  }

  return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
}

export async function getOrdersChartData(): Promise<ChartDataPoint[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("created_at")
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const buckets = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const order of data ?? []) {
    const key = order.created_at.slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
}

export async function getSalesChartData(): Promise<ChartDataPoint[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("order_items")
    .select("quantity, created_at")
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const buckets = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const item of data ?? []) {
    const key = item.created_at.slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + item.quantity);
    }
  }

  return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
}

export async function getProductsChartData(): Promise<ChartDataPoint[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select("created_at")
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const buckets = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    buckets.set(d.toISOString().slice(0, 10), 0);
  }

  for (const product of data ?? []) {
    const key = product.created_at.slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.entries()).map(([label, value]) => ({ label, value }));
}

export async function getLowStockAlerts(): Promise<LowStockItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("inventory")
    .select("id, quantity, low_stock_threshold, product:products(id, name, sku, barcode)")
    .filter("quantity", "lte", "low_stock_threshold")
    .order("quantity", { ascending: true })
    .limit(10);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    quantity: row.quantity,
    low_stock_threshold: row.low_stock_threshold,
    product: Array.isArray(row.product) ? row.product[0] : row.product,
  }));
}
