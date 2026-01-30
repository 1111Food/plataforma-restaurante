-- CLONE MENU FROM 'Demo' (prueba) TO '11:ONCE STUDIO' (11-once-studio)

DO $$
DECLARE
    source_slug TEXT := 'prueba';
    target_slug TEXT := '11-once-studio';
    source_id UUID;
    target_id UUID;
    
    old_cat RECORD;
    new_cat_id UUID;
    
    old_item RECORD;
    new_item_id UUID;
BEGIN
    -- 1. Get IDs
    SELECT id INTO source_id FROM restaurants WHERE slug = source_slug;
    SELECT id INTO target_id FROM restaurants WHERE slug = target_slug;

    IF source_id IS NULL OR target_id IS NULL THEN
        RAISE NOTICE 'Source or Target restaurant not found';
        RETURN;
    END IF;

    -- 2. Loop through Categories
    FOR old_cat IN 
        SELECT * FROM categories 
        WHERE restaurant_id = source_id 
        ORDER BY display_order ASC 
    LOOP
        -- Insert Category Copy
        INSERT INTO categories (name, restaurant_id, display_order)
        VALUES (old_cat.name, target_id, old_cat.display_order)
        RETURNING id INTO new_cat_id;
        
        RAISE NOTICE 'Cloned Category: %', old_cat.name;

        -- 3. Loop through Menu Items in this Category
        FOR old_item IN 
            SELECT * FROM menu_items 
            WHERE category_id = old_cat.id 
        LOOP
            -- Insert Item Copy
            -- Note: We map columns dynamically. Ensure these match your schema.
            INSERT INTO menu_items (
                name, 
                description, 
                price, 
                category_id, 
                restaurant_id, 
                image_url, 
                is_available, 
                detail_image_url, 
                third_image_url
            )
            VALUES (
                old_item.name, 
                old_item.description, 
                old_item.price, 
                new_cat_id, 
                target_id, 
                old_item.image_url, 
                old_item.is_available, 
                old_item.detail_image_url, 
                old_item.third_image_url
            )
            RETURNING id INTO new_item_id;

            -- 4. Clone Modifier Links (Item -> Modifier Group)
            -- We are linking the NEW items to the SAME OLD groups (since groups are global currently)
            INSERT INTO item_modifiers (item_id, modifier_group_id)
            SELECT new_item_id, modifier_group_id
            FROM item_modifiers
            WHERE item_id = old_item.id;
            
        END LOOP;
        
    END LOOP;

    -- 5. Copy Events (Optional)
    INSERT INTO restaurant_events (restaurant_id, title, description, date, image_url, event_type)
    SELECT target_id, title, description, date, image_url, event_type
    FROM restaurant_events
    WHERE restaurant_id = source_id;

END $$;
