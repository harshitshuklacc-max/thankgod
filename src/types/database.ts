export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  category_id: string | null;
  brand: string | null;
  gender: "men" | "women" | "unisex" | "kids" | null;
  color: string | null;
  sizes: string[];
  purchase_price: number;
  selling_price: number;
  discount_percent: number;
  sku: string | null;
  barcode: string | null;
  barcode_type: "code128" | "ean13" | "qrcode";
  is_active: boolean;
  is_featured: boolean;
  is_trending: boolean;
  is_new_arrival: boolean;
  is_best_seller: boolean;
  total_sold: number;
  created_at: string;
  updated_at: string;
  category?: Category;
  images?: ProductImage[];
  inventory?: Inventory;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryLog {
  id: string;
  product_id: string;
  change_type: string;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference_type: string | null;
  reference_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  customer_id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  status: OrderStatus;
  order_type: "online" | "offline";
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  shipping_amount: number;
  grand_total: number;
  payment_method: string | null;
  payment_status: string;
  shipping_address: Json | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  barcode: string | null;
  sku: string | null;
  size: string | null;
  quantity: number;
  unit_price: number;
  discount: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  grand_total: number;
  invoice_type: "sale" | "pos";
  is_archived: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  invoice_items?: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string | null;
  product_name: string;
  barcode: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  customer_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface WishlistItem {
  id: string;
  customer_id: string;
  product_id: string;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface BusyImport {
  id: string;
  file_name: string;
  file_url: string | null;
  total_rows: number;
  added_count: number;
  updated_count: number;
  failed_count: number;
  import_report: Json;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: Json;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalInventory: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  onlineOrders: number;
  offlineOrders: number;
  lowStockCount: number;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
  image?: string;
  barcode?: string;
  sku?: string;
}

export interface POSCartItem {
  product: Product;
  quantity: number;
  discount: number;
}

export interface ImportReportItem {
  row: number;
  product_name: string;
  barcode: string;
  status: "added" | "updated" | "failed";
  message?: string;
}
