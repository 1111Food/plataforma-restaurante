-- Fix missing columns in restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS delivery_zones TEXT[];
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS admin_password TEXT;

-- Update Demo restaurant with some default zones if needed
UPDATE restaurants 
SET delivery_zones = ARRAY['Zona 1', 'Zona 4', 'Zona 9', 'Zona 10', 'Zona 14']
WHERE slug = 'prueba' AND delivery_zones IS NULL;
