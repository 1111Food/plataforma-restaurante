'use client'

import { useCart } from './CartProvider'
import Link from 'next/link'

export default function CheckoutBar({ restaurantSlug }: { restaurantSlug: string }) {
    const { items, cartTotal } = useCart()

    if (items.length === 0) return null

    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0)

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-white/10 p-4 z-50 animate-in slide-in-from-bottom-5">
            <div className="max-w-3xl mx-auto flex items-center justify-between">
                <div>
                    <p className="text-white font-bold text-lg">
                        {totalItems} {totalItems === 1 ? 'item' : 'items'}
                    </p>
                    <p className="text-amber-500 font-bold">
                        Q{cartTotal.toFixed(2)}
                    </p>
                </div>
                <Link
                    href={`/${restaurantSlug}/checkout`}
                    className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition active:scale-95"
                >
                    Ver Pedido
                </Link>
            </div>
        </div>
    )
}
