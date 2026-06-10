-- SHOE MAFIA Enterprise Database Schema
-- Run this in Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand TEXT,
  gender TEXT CHECK (gender IN ('men', 'women', 'unisex', 'kids')),
  color TEXT,
  sizes JSONB DEFAULT '[]',
  purchase_price DECIMAL(12,2) DEFAULT 0,
  selling_price DECIMAL(12,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  sku TEXT UNIQUE,
  barcode TEXT UNIQUE,
  barcode_type TEXT DEFAULT 'code128' CHECK (barcode_type IN ('code128', 'ean13', 'qrcode')),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  is_trending BOOLEAN DEFAULT false,
  is_new_arrival BOOLEAN DEFAULT false,
  is_best_seller BOOLEAN DEFAULT false,
  total_sold INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Images
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Logs
CREATE TABLE IF NOT EXISTS inventory_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('sale', 'purchase', 'adjustment', 'import', 'return', 'pos_sale')),
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Barcodes
CREATE TABLE IF NOT EXISTS barcodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  barcode_value TEXT NOT NULL UNIQUE,
  barcode_type TEXT DEFAULT 'code128',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers (extends auth.users)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Addresses
CREATE TABLE IF NOT EXISTS addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home',
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled')),
  order_type TEXT DEFAULT 'online' CHECK (order_type IN ('online', 'offline')),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  shipping_amount DECIMAL(12,2) DEFAULT 0,
  grand_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded', 'cod')),
  shipping_address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  barcode TEXT,
  sku TEXT,
  size TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  discount DECIMAL(12,2) DEFAULT 0,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL UNIQUE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_name TEXT,
  customer_phone TEXT,
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  grand_total DECIMAL(12,2) NOT NULL,
  invoice_type TEXT DEFAULT 'sale' CHECK (invoice_type IN ('sale', 'pos')),
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  barcode TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  method TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, customer_id)
);

-- Wishlists
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id)
);

-- Busy Imports
CREATE TABLE IF NOT EXISTS busy_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  file_url TEXT,
  total_rows INTEGER DEFAULT 0,
  added_count INTEGER DEFAULT 0,
  updated_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  import_report JSONB DEFAULT '[]',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  performed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backups
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  backup_type TEXT DEFAULT 'full',
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admins
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'categories', 'products', 'product_images', 'inventory', 'inventory_logs',
    'barcodes', 'customers', 'addresses', 'orders', 'order_items', 'invoices',
    'invoice_items', 'payments', 'reviews', 'wishlists', 'busy_imports',
    'settings', 'notifications', 'audit_logs', 'backups', 'admins'
  ])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
      CREATE TRIGGER update_%s_updated_at
        BEFORE UPDATE ON %s
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END;
$$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_invoices_created ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_archived ON invoices(is_archived);

-- Default categories
INSERT INTO categories (name, slug, description) VALUES
  ('Men''s Shoes', 'mens-shoes', 'Premium footwear for men'),
  ('Women''s Shoes', 'womens-shoes', 'Stylish footwear for women'),
  ('Sports Shoes', 'sports-shoes', 'Athletic and sports footwear'),
  ('Casual Shoes', 'casual-shoes', 'Everyday casual footwear'),
  ('Sneakers', 'sneakers', 'Trendy sneaker collection')
ON CONFLICT (slug) DO NOTHING;

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('store_info', '{"name":"SHOE MAFIA","phone":"07587555558","address":"Bus Stand, Old Telephone Exchange Road, Telipara, Bilaspur, Chhattisgarh 495001","hours":"Open Daily, Closes 11 PM","rating":4.3}'),
  ('tax_settings', '{"gst_rate":18,"enabled":true}'),
  ('barcode_settings', '{"default_type":"code128","auto_generate":true}'),
  ('invoice_settings', '{"prefix":"SM","retention_days":365}'),
  ('low_stock_threshold', '{"default":5}'),
  ('theme_settings', '{"primary":"#16A34A","secondary":"#000000","accent":"#FFFFFF"}')
ON CONFLICT (key) DO NOTHING;

-- RLS Policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE busy_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Public read for active products
CREATE POLICY "Public can view active categories" ON categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view active products" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view product images" ON product_images FOR SELECT USING (true);
CREATE POLICY "Public can view approved reviews" ON reviews FOR SELECT USING (is_approved = true);

-- Customer policies
CREATE POLICY "Customers can view own profile" ON customers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Customers can update own profile" ON customers FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Customers can insert own profile" ON customers FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Customers can manage own addresses" ON addresses FOR ALL USING (auth.uid() = customer_id);
CREATE POLICY "Customers can view own orders" ON orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Customers can view own order items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid())
);
CREATE POLICY "Customers can manage own wishlist" ON wishlists FOR ALL USING (auth.uid() = customer_id);
CREATE POLICY "Customers can manage own reviews" ON reviews FOR ALL USING (auth.uid() = customer_id);
CREATE POLICY "Customers can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- Service role bypass (admin operations use service role key)
CREATE POLICY "Service role full access categories" ON categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access products" ON products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access product_images" ON product_images FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access inventory" ON inventory FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access inventory_logs" ON inventory_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access barcodes" ON barcodes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access orders" ON orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access order_items" ON order_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access invoices" ON invoices FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access invoice_items" ON invoice_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access payments" ON payments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access reviews" ON reviews FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access busy_imports" ON busy_imports FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access settings" ON settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access notifications" ON notifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access audit_logs" ON audit_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access backups" ON backups FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access admins" ON admins FOR ALL USING (auth.role() = 'service_role');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Storage buckets (run in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('backups', 'backups', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('imports', 'imports', false);

-- Function: decrease inventory on sale
CREATE OR REPLACE FUNCTION decrease_inventory(
  p_product_id UUID,
  p_quantity INTEGER,
  p_change_type TEXT DEFAULT 'sale',
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_created_by TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_qty INTEGER;
  v_new_qty INTEGER;
BEGIN
  SELECT quantity INTO v_current_qty FROM inventory WHERE product_id = p_product_id FOR UPDATE;
  IF v_current_qty IS NULL THEN
    RETURN FALSE;
  END IF;
  IF v_current_qty < p_quantity THEN
    RETURN FALSE;
  END IF;
  v_new_qty := v_current_qty - p_quantity;
  UPDATE inventory SET quantity = v_new_qty WHERE product_id = p_product_id;
  INSERT INTO inventory_logs (product_id, change_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, created_by)
  VALUES (p_product_id, p_change_type, -p_quantity, v_current_qty, v_new_qty, p_reference_type, p_reference_id, p_created_by);
  UPDATE products SET total_sold = total_sold + p_quantity WHERE id = p_product_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: increase inventory
CREATE OR REPLACE FUNCTION increase_inventory(
  p_product_id UUID,
  p_quantity INTEGER,
  p_change_type TEXT DEFAULT 'purchase',
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL,
  p_created_by TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_current_qty INTEGER;
  v_new_qty INTEGER;
BEGIN
  SELECT quantity INTO v_current_qty FROM inventory WHERE product_id = p_product_id FOR UPDATE;
  IF v_current_qty IS NULL THEN
    INSERT INTO inventory (product_id, quantity) VALUES (p_product_id, p_quantity);
    INSERT INTO inventory_logs (product_id, change_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, created_by)
    VALUES (p_product_id, p_change_type, p_quantity, 0, p_quantity, p_reference_type, p_reference_id, p_created_by);
    RETURN TRUE;
  END IF;
  v_new_qty := v_current_qty + p_quantity;
  UPDATE inventory SET quantity = v_new_qty WHERE product_id = p_product_id;
  INSERT INTO inventory_logs (product_id, change_type, quantity_change, quantity_before, quantity_after, reference_type, reference_id, created_by)
  VALUES (p_product_id, p_change_type, p_quantity, v_current_qty, v_new_qty, p_reference_type, p_reference_id, p_created_by);
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: archive old invoices (run via cron)
CREATE OR REPLACE FUNCTION archive_old_invoices() RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_retention_days INTEGER;
BEGIN
  SELECT (value->>'retention_days')::INTEGER INTO v_retention_days FROM settings WHERE key = 'invoice_settings';
  IF v_retention_days IS NULL THEN v_retention_days := 365; END IF;
  UPDATE invoices SET is_archived = true, archived_at = NOW()
  WHERE is_archived = false AND created_at < NOW() - (v_retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
