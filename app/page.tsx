import { createClient } from '@supabase/supabase-js'
import MenuClient from './components/MenuClient'
import { CartProvider } from './components/CartProvider'
import { getRestaurantBySlug } from './utils/getRestaurant'

// Cliente de Supabase (Still needed for modifiers fetch)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Tipos (Duplicados por ahora, mantener sincronizados)
type MenuItem = {
    id: string
    name: string
    description: string | null
    price: number
}

type Category = {
    id: string
    name: string
    menu_items: MenuItem[]
}

type Restaurant = {
    id: string
    slug: string
    name: string
    logo_url?: string
    template_style?: 'classic-grid' | 'luxury-showcase' | 'minimal-list' | 'urban-grid' // New
    categories: Category[]
}

export default async function Home() {
    const slug = 'prueba' // Hardcoded for Landing

    // PASO 1: Datos Principales usando la utilidad
    const restaurantData = await getRestaurantBySlug(slug)

    if (restaurantData) {
        // PASO 2: Recolectar IDs de todos los items para hacer fetch de modifiers
        const allItems = restaurantData.categories.flatMap((cat: any) => cat.menu_items || [])
        const itemIds = allItems.map((item: any) => item.id)

        if (itemIds.length > 0) {
            // PASO 3: Fetch Independiente de Modificadores (Split Query)
            const { data: modifiersData, error: modError } = await supabase
                .from('item_modifiers')
                .select(`
                    item_id,
                    group:modifier_groups (
                        id, name, min_selection, max_selection,
                        options:modifier_options (
                            id, name, price_adjustment, is_available
                        )
                    )
                `)
                .in('item_id', itemIds)

            if (modError) {
                console.error('Error fetching modifiers:', modError)
            } else if (modifiersData) {
                // PASO 4: Merge en Memoria
                const modMap = new Map<string, any[]>()

                modifiersData.forEach((mod: any) => {
                    if (mod.group && mod.group.options) {
                        mod.group.options.sort((a: any, b: any) => a.price_adjustment - b.price_adjustment)
                    }

                    const existing = modMap.get(mod.item_id) || []
                    existing.push(mod)
                    modMap.set(mod.item_id, existing)
                })

                // Inyectar los modificadores
                restaurantData.categories.forEach((cat: any) => {
                    if (cat.menu_items) {
                        cat.menu_items.forEach((item: any) => {
                            item.item_modifiers = modMap.get(item.id) || []
                        })
                    }
                })
            }
        }
    }

    if (!restaurantData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white font-sans">
                <h1 className="text-4xl font-bold mb-2 text-red-500">404</h1>
                <p className="text-neutral-400">Restaurante no encontrado</p>
                <p className="text-xs text-neutral-600 mt-2">¿Estás seguro que el slug 'prueba' existe?</p>
            </div>
        )
    }

    const restaurant = restaurantData as unknown as Restaurant

    return (
        <CartProvider>
            <MenuClient restaurant={restaurant} />
        </CartProvider>
    )
}
