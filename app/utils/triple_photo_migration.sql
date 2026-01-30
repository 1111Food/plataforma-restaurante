-- Add third_image_url column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'menu_items' AND column_name = 'third_image_url') THEN
        ALTER TABLE menu_items ADD COLUMN third_image_url text;
    END IF;
END $$;
