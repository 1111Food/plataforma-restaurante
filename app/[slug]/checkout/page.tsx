import CheckoutClient from '../../components/CheckoutClient'
import { getRestaurantBasicBySlug } from '../../utils/getRestaurant'

type Restaurant = {
    id: string
    name: string
    phone: string | null
    slug: string
    delivery_zones: string[]
}

export default async function CheckoutPage({
    params,
}: {
    params: Promise<{ slug: string }>
}) {
    const { slug } = await params

    // Fetch using utility
    const restaurantData = await getRestaurantBasicBySlug(slug)

    if (!restaurantData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white font-sans">
                <h1 className="text-4xl font-bold mb-2 text-red-500">404</h1>
                <p className="text-neutral-400">Restaurante no encontrado</p>
            </div>
        )
    }

    const restaurant = {
        ...restaurantData,
        delivery_zones: restaurantData.delivery_zones || []
    } as unknown as Restaurant

    return <CheckoutClient restaurant={restaurant} />
}
