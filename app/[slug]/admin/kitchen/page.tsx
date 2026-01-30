import { createClient } from '@supabase/supabase-js'
import KitchenClient from '../../../components/admin/KitchenClient'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Restaurant = {
    id: string
    name: string
    slug: string
}

export default async function KitchenPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    const { data: restaurantData, error } = await supabase
        .from('restaurants')
        .select('id, name, slug')
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

    return <KitchenClient restaurant={restaurant} />
}
