-- Fix missing columns in restaurants table part 2
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT '#FFB800';
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Update Demo
UPDATE restaurants 
SET theme_color = '#FFB800'
WHERE slug = 'prueba' AND theme_color IS NULL;
