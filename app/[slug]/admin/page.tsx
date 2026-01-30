import { createClient } from '@supabase/supabase-js'
import AdminDashboard from '../../components/admin/AdminDashboard'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Restaurant = {
    id: string
    name: string
    phone: string | null
    slug: string
    menu_items: any[] // Simplificamos por ahora
    categories: any[]
}

export default async function AdminPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    // Fetch full data for admin
    const { data: restaurantData, error } = await supabase
        .from('restaurants')
        .select('*, categories(*, menu_items(*)), restaurant_events(*)')
        .eq('slug', slug)
        .single()

    if (error || !restaurantData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white font-sans">
                <h1 className="text-4xl font-bold mb-2 text-red-500">404</h1>
                <p className="text-neutral-400">Restaurante no encontrado</p>
            </div>
        )
    }

    const restaurant = restaurantData as unknown as Restaurant

    return <AdminDashboard restaurant={restaurant} />
}
