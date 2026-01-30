import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function getRestaurantBySlug(slug: string) {
    const { data, error } = await supabase
        .from('restaurants')
        .select(`
            *,
            categories (
                *,
                menu_items (*)
            ),
            restaurant_events (*)
        `)
        .eq('slug', slug)
        .order('display_order', { foreignTable: 'categories', ascending: true })
        .single()

    if (error) {
        console.error('Error fetching restaurant:', error)
        return null
    }

    return data
}

export async function getRestaurantBasicBySlug(slug: string) {
    const { data, error } = await supabase
        .from('restaurants')
        .select('id, name, phone, slug, delivery_zones, logo_url, theme_color')
        .eq('slug', slug)
        .single()

    if (error) {
        console.error('Error fetching restaurant basic:', error)
        return null
    }

    return data
}
