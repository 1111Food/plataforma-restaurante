-- Create '11:ONCE STUDIO' restaurant
INSERT INTO restaurants (
    name, 
    slug, 
    theme_color, 
    logo_url, 
    phone, 
    delivery_zones,
    admin_password
)
VALUES (
    '11:ONCE STUDIO', 
    '11-once-studio', 
    '#FFB800', 
    NULL, 
    '+502 0000-0000', 
    ARRAY['Zona 10', 'Zona 14', 'Carretera a El Salvador'],
    'admin123' -- Temporary password if needed by your logic, or NULL
)
ON CONFLICT (slug) DO NOTHING;

-- Log the credentials (conceptual)
-- Restaurant Created: 11:ONCE STUDIO
-- Slug: 11-once-studio
-- Url: domain.com/11-once-studio
-- Admin: domain.com/11-once-studio/admin
