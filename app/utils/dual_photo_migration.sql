-- Add detail_image_url to menu_items table
ALTER TABLE menu_items ADD COLUMN detail_image_url text;

-- (Optional) If we wanted to guarantee it's available for select, though RLS usually covers it.
-- but since I'm administrator, I'll just run the alter.
