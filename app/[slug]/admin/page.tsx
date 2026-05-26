import { createClient } from '@supabase/supabase-js'
import AdminDashboard from '../../components/admin/AdminDashboard'
import AdminLoginForm from '../../components/admin/AdminLoginForm'
import { verifySession } from '../../actions/auth'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Restaurant = {
    id: string
    name: string
    phone: string | null
    slug: string
    menu_items: any[]
    categories: any[]
}

export default async function AdminPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    // 1. Verify session server-side
    const session = await verifySession(slug)

    if (!session) {
        // If not authenticated, fetch only basic details for the login UI
        const { data: basicData } = await supabase
            .from('restaurants')
            .select('id, name, slug, logo_url')
            .eq('slug', slug)
            .single()

        if (!basicData) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white font-sans">
                    <h1 className="text-4xl font-bold mb-2 text-red-500">404</h1>
                    <p className="text-neutral-400">Restaurante no encontrado</p>
                </div>
            )
        }

        return (
            <AdminLoginForm 
                slug={slug} 
                restaurantName={basicData.name} 
                logoUrl={basicData.logo_url} 
            />
        )
    }

    // 2. Fetch full data for admin (if authenticated)
    const { data: restaurantData, error } = await supabase
        .from('restaurants')
        .select('*, categories(*, menu_items(*)), restaurant_events(*)')
        .eq('slug', slug)
        .single()

    if (error || !restaurantData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white font-sans">
                <h1 className="text-4xl font-bold mb-2 text-red-500">404</h1>
                <p className="text-neutral-400">Restaurante no encontrado o error de base de datos</p>
            </div>
        )
    }

    // CRITICAL: Strip the admin_password column entirely on the server so it is never passed to client components!
    if (restaurantData) {
        delete (restaurantData as any).admin_password
    }

    const restaurant = restaurantData as unknown as Restaurant

    return <AdminDashboard restaurant={restaurant} />
}
