-- 1. Create Restaurants Table (if not exists)
CREATE TABLE IF NOT EXISTS restaurants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID REFERENCES auth.users(id),
    logo_url TEXT,
    theme_color TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Insert Demo Restaurant if not exists
INSERT INTO restaurants (name, slug, theme_color)
VALUES ('Demo', 'prueba', '#FFB800')
ON CONFLICT (slug) DO NOTHING;

-- 3. Add restaurant_id to tables and migrate data
DO $$
DECLARE
    demo_id UUID;
BEGIN
    -- Get the ID of the Demo restaurant
    SELECT id INTO demo_id FROM restaurants WHERE slug = 'prueba';

    -- Categories
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'restaurant_id') THEN
        ALTER TABLE categories ADD COLUMN restaurant_id UUID REFERENCES restaurants(id);
    END IF;
    -- Link existing data to Demo
    UPDATE categories SET restaurant_id = demo_id WHERE restaurant_id IS NULL;
    -- Enforce Not Null
    ALTER TABLE categories ALTER COLUMN restaurant_id SET NOT NULL;


    -- Menu Items
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'restaurant_id') THEN
        ALTER TABLE menu_items ADD COLUMN restaurant_id UUID REFERENCES restaurants(id);
    END IF;
    UPDATE menu_items SET restaurant_id = demo_id WHERE restaurant_id IS NULL;
    ALTER TABLE menu_items ALTER COLUMN restaurant_id SET NOT NULL;


    -- Orders
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'restaurant_id') THEN
        ALTER TABLE orders ADD COLUMN restaurant_id UUID REFERENCES restaurants(id);
    END IF;
    UPDATE orders SET restaurant_id = demo_id WHERE restaurant_id IS NULL;
    ALTER TABLE orders ALTER COLUMN restaurant_id SET NOT NULL;
    
    
    -- Restaurant Events (Assuming this table exists based on previous file views)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'restaurant_events') THEN
         IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurant_events' AND column_name = 'restaurant_id') THEN
            ALTER TABLE restaurant_events ADD COLUMN restaurant_id UUID REFERENCES restaurants(id);
        END IF;
        UPDATE restaurant_events SET restaurant_id = demo_id WHERE restaurant_id IS NULL;
        ALTER TABLE restaurant_events ALTER COLUMN restaurant_id SET NOT NULL;
    END IF;

END $$;

-- 4. Enable RLS
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_events ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies

-- Restaurants
DROP POLICY IF EXISTS "Public restaurants read" ON restaurants;
CREATE POLICY "Public restaurants read" ON restaurants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner restaurants all" ON restaurants;
CREATE POLICY "Owner restaurants all" ON restaurants USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Categories
DROP POLICY IF EXISTS "Public categories read" ON categories;
CREATE POLICY "Public categories read" ON categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner categories all" ON categories;
CREATE POLICY "Owner categories all" ON categories 
USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()))
WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- Menu Items
DROP POLICY IF EXISTS "Public menu_items read" ON menu_items;
CREATE POLICY "Public menu_items read" ON menu_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner menu_items all" ON menu_items;
CREATE POLICY "Owner menu_items all" ON menu_items 
USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()))
WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- Orders
DROP POLICY IF EXISTS "Public orders insert" ON orders;
CREATE POLICY "Public orders insert" ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public orders read own" ON orders;
-- Ideally, users can only read their own orders via session or something, but for now allow public read by ID/UUID if needed, or just Owners.
-- Start with: Owners can view/edit all orders of their restaurant.
DROP POLICY IF EXISTS "Owner orders all" ON orders;
CREATE POLICY "Owner orders all" ON orders 
USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()))
WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- Events
DROP POLICY IF EXISTS "Public events read" ON restaurant_events;
CREATE POLICY "Public events read" ON restaurant_events FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner events all" ON restaurant_events;
CREATE POLICY "Owner events all" ON restaurant_events 
USING (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()))
WITH CHECK (restaurant_id IN (SELECT id FROM restaurants WHERE owner_id = auth.uid()));

-- TEMPORARY POLICY: Allow authenticated users to edit 'Demo' (since it has no owner yet)
-- This prevents the admin panel from breaking immediately after migration until an owner is claimed.
CREATE POLICY "Temp Demo Admin" ON restaurants USING (slug = 'prueba' AND auth.role() = 'authenticated');
