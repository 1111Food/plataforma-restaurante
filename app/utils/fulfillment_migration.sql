-- Fulfillment Options Migration

-- 1. Add Delivery Settings to Restaurants Table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS delivery_zones text[]; -- Array of strings e.g. ["Zona 10", "Zona 14"]

-- 2. Add Fulfillment Details to Orders Table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS fulfillment_method text DEFAULT 'dine_in', -- 'dine_in', 'pickup', 'delivery'
ADD COLUMN IF NOT EXISTS delivery_address text,
ADD COLUMN IF NOT EXISTS delivery_zone text,
ADD COLUMN IF NOT EXISTS pickup_time text,
ADD COLUMN IF NOT EXISTS customer_whatsapp text;

-- 3. (Optional) Comment on columns for clarity
COMMENT ON COLUMN orders.fulfillment_method IS 'Method of order: dine_in, pickup, or delivery';
COMMENT ON COLUMN restaurants.delivery_zones IS 'List of zones where delivery is available';
