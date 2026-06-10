-- Customer cart items for logged-in users
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_id, product_id, size)
);

CREATE INDEX IF NOT EXISTS idx_cart_items_customer ON cart_items(customer_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can manage own cart" ON cart_items
  FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "Service role full access cart_items" ON cart_items
  FOR ALL USING (auth.role() = 'service_role');

-- Allow public read of inventory for stock display
CREATE POLICY "Public can view inventory" ON inventory FOR SELECT USING (true);

DROP TRIGGER IF EXISTS update_cart_items_updated_at ON cart_items;
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
