'use client'

import { useState, useEffect } from 'react'
import { CartProvider, useCart } from './CartProvider'
import Link from 'next/link'
import { Utensils, ShoppingBag, Bike, MapPin, Clock, User, MessageCircle } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { formatCurrency } from '../utils/formatCurrency'

// Initialize Supabase Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Restaurant = {
    id: string
    name: string
    phone: string | null
    slug: string
    delivery_zones?: string[]
}

type FulfillmentMethod = 'dine_in' | 'pickup' | 'delivery'

function CheckoutForm({ restaurant }: { restaurant: Restaurant }) {
    const { items, cartTotal, removeFromCart, tableNumber: savedTableNumber } = useCart()

    // Form State
    // If savedTableNumber exists, default to 'dine_in', otherwise default to 'dine_in' (or could start flexible)
    const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>(savedTableNumber ? 'dine_in' : 'dine_in')

    // Dine-in Fields
    // If savedTableNumber, use it and potentially lockout editing? 
    // User requested: "Pre-fill... and LOCK IT (readOnly)"
    const [tableNumber, setTableNumber] = useState(savedTableNumber || '')

    // Effect to ensure we sync if context loads late or changes (unlikely in this flow but safe)
    useEffect(() => {
        if (savedTableNumber) {
            setTableNumber(savedTableNumber)
            setFulfillmentMethod('dine_in')
        }
    }, [savedTableNumber])

    // Pickup/Delivery Fields
    const [customerName, setCustomerName] = useState('')
    const [whatsapp, setWhatsapp] = useState('')

    // Pickup specific
    const [pickupTime, setPickupTime] = useState('')

    // Delivery specific
    const [deliveryZone, setDeliveryZone] = useState('')
    const [deliveryAddress, setDeliveryAddress] = useState('')

    const [isSubmitting, setIsSubmitting] = useState(false)

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-2xl font-bold mb-4">Tu carrito está vacío</h1>
                <Link href={`/${restaurant.slug}`} className="text-amber-500 hover:underline">
                    Volver al menú
                </Link>
            </div>
        )
    }

    const validateForm = () => {
        if (!customerName.trim() && fulfillmentMethod !== 'dine_in') return 'Por favor ingresa tu nombre'

        if (fulfillmentMethod === 'dine_in' && !tableNumber.trim()) return 'Por favor indica tu número de mesa'

        if (fulfillmentMethod === 'delivery') {
            if (!deliveryZone) return 'Selecciona una zona de entrega'
            if (!deliveryAddress.trim()) return 'Ingresa tu dirección exacta'
            if (!whatsapp.trim()) return 'Necesitamos tu WhatsApp para la entrega'
        }

        return null
    }

    // Helper just for metadata construction (used by Stripe mostly)
    const getOrderMetadata = () => {
        return {
            restaurant_id: restaurant.id,
            customer_name: customerName || `Mesa ${tableNumber}`,
            table_number: fulfillmentMethod === 'dine_in' ? tableNumber : 'N/A',
            fulfillment_method: fulfillmentMethod,
            delivery_zone: fulfillmentMethod === 'delivery' ? deliveryZone : null,
            delivery_address: fulfillmentMethod === 'delivery' ? deliveryAddress : null,
            pickup_time: fulfillmentMethod === 'pickup' ? pickupTime : null,
            customer_whatsapp: whatsapp || null,
            total_amount: cartTotal,
            items: items,
        }
    }

    const handleWhatsAppOrder = async () => {
        const error = validateForm()
        if (error) {
            alert(error)
            return
        }

        setIsSubmitting(true)

        try {
            // Simplified Insert for WhatsApp
            // We use 'pending_whatsapp' status to distinguish
            const waOrderPayload = {
                restaurant_id: restaurant.id,
                customer_name: customerName || (fulfillmentMethod === 'dine_in' ? `Mesa ${tableNumber}` : 'Cliente'),
                table_number: fulfillmentMethod === 'dine_in' ? tableNumber : 'N/A',
                fulfillment_method: fulfillmentMethod,
                delivery_zone: fulfillmentMethod === 'delivery' ? deliveryZone : null,
                delivery_address: fulfillmentMethod === 'delivery' ? deliveryAddress : null,
                pickup_time: fulfillmentMethod === 'pickup' ? pickupTime : null,
                customer_whatsapp: whatsapp || null,
                total_amount: cartTotal,
                items: items, // Save items as JSON
                status: 'pending_whatsapp'
            }

            console.log('Sending Order to Supabase (WA):', waOrderPayload);

            // 1. Save Order to Supabase
            const { data, error: dbError } = await supabase
                .from('orders')
                .insert([waOrderPayload])
                .select()

            if (dbError) {
                console.error('Error saving order:', dbError)
                alert(`Error al guardar: ${dbError.message || 'Intenta de nuevo'}`)
                setIsSubmitting(false)
                return
            }

            // 2. Build WhatsApp Message
            const itemsList = items
                .map((item) => `• ${item.quantity}x ${item.name} (${formatCurrency(item.price * item.quantity)})`)
                .join('\n')

            let methodDetails = ''
            if (fulfillmentMethod === 'dine_in') methodDetails = `🍽️ *Mesa:* ${tableNumber}`
            if (fulfillmentMethod === 'pickup') methodDetails = `🛍️ *Para Llevar*\n⏰ *Hora:* ${pickupTime || 'Lo antes posible'}`
            if (fulfillmentMethod === 'delivery') methodDetails = `🛵 *A Domicilio*\n📍 *Zona:* ${deliveryZone}\n🏠 *Dirección:* ${deliveryAddress}\n📱 *WA:* ${whatsapp}`

            const message = `*NUEVO PEDIDO - ${restaurant.name}*\n\n` +
                `*Cliente:* ${customerName}\n` +
                `${methodDetails}\n\n` +
                `*Detalle del Pedido:*\n${itemsList}\n\n` +
                `*TOTAL: ${formatCurrency(cartTotal)}*`

            const phoneNumber = restaurant.phone || ''
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

            console.log('Redirecting to WhatsApp:', whatsappUrl);
            window.open(whatsappUrl, '_blank')
            // Optional: Clear cart here or redirect to success page
            // For now, we keep user on page or could redirect to /success?wa=true

        } catch (err: any) {
            console.error('Catch Error:', err)
            alert('Error inesperado: ' + (err.message || err))
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleStripePayment = async () => {
        const error = validateForm()
        if (error) {
            alert(error)
            return
        }

        setIsSubmitting(true)

        try {
            const orderMetadata = getOrderMetadata()

            // 1. Save pending order
            await supabase.from('orders').insert([{ ...orderMetadata, status: 'pending_payment' }])

            // 2. Call Stripe API
            const response = await fetch('/api/checkout_sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cartItems: items,
                    restaurantId: restaurant.id,
                    restaurantSlug: restaurant.slug,
                    ...orderMetadata
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Error al conectar con pagos.');
                setIsSubmitting(false);
            }

        } catch (err) {
            console.error('Payment Error:', err)
            alert('Error inesperado al procesar el pago.')
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-6 pb-24">
            <header className="mb-8 flex items-center justify-between">
                <Link href={`/${restaurant.slug}`} className="text-sm text-neutral-400 hover:text-white">
                    ← Volver al Menú
                </Link>
                <h1 className="text-xl font-bold uppercase tracking-widest">{restaurant.name}</h1>
            </header>

            <main className="max-w-md mx-auto space-y-8">
                {/* Fulfillment Selector */}
                <div className="grid grid-cols-3 bg-neutral-900 rounded-xl p-1 gap-1 border border-white/10">
                    <button
                        onClick={() => setFulfillmentMethod('dine_in')}
                        className={`flex flex-col items-center gap-2 py-3 rounded-lg transition-all ${fulfillmentMethod === 'dine_in' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Utensils size={20} />
                        <span className="text-xs uppercase">Aquí</span>
                    </button>
                    <button
                        onClick={() => setFulfillmentMethod('pickup')}
                        className={`flex flex-col items-center gap-2 py-3 rounded-lg transition-all ${fulfillmentMethod === 'pickup' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <ShoppingBag size={20} />
                        <span className="text-xs uppercase">Pick-up</span>
                    </button>
                    <button
                        onClick={() => setFulfillmentMethod('delivery')}
                        disabled={!restaurant.delivery_zones?.length}
                        className={`flex flex-col items-center gap-2 py-3 rounded-lg transition-all ${fulfillmentMethod === 'delivery'
                            ? 'bg-amber-500 text-black font-bold'
                            : !restaurant.delivery_zones?.length
                                ? 'opacity-30 cursor-not-allowed'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
                    >
                        <Bike size={20} />
                        <span className="text-xs uppercase">Delivery</span>
                    </button>
                </div>

                {/* No Zones Warning */}
                {!restaurant.delivery_zones?.length && (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-yellow-200 text-xs text-center">
                        <span className="block font-bold mb-1">Sin cobertura a domicilio</span>
                        El restaurante no ha configurado zonas de entrega aún. Puedes elegir Pick-up o Comer Aquí.
                    </div>
                )}

                {/* Dynamic Form Fields */}
                <section className="bg-neutral-900 border border-white/10 p-6 rounded-xl space-y-4 animate-fade-in">
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                        {fulfillmentMethod === 'dine_in' && <Utensils size={18} className="text-amber-500" />}
                        {fulfillmentMethod === 'pickup' && <ShoppingBag size={18} className="text-amber-500" />}
                        {fulfillmentMethod === 'delivery' && <Bike size={18} className="text-amber-500" />}
                        Datos del Pedido
                    </h2>

                    {/* DINE IN FIELDS */}
                    {fulfillmentMethod === 'dine_in' && (
                        <div>
                            <label className="block text-sm text-neutral-400 mb-1">Número de Mesa <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                value={tableNumber}
                                readOnly={!!savedTableNumber} // Lock if coming from QR
                                onChange={(e) => setTableNumber(e.target.value)}
                                className={`w-full bg-black border rounded-lg p-3 text-white outline-none ${savedTableNumber ? 'border-amber-500/50 text-amber-500 cursor-not-allowed' : 'border-neutral-700 focus:border-amber-500'}`}
                                placeholder="Ej: 5"
                            />
                            {savedTableNumber && (
                                <p className="text-[10px] text-amber-500 mt-1">
                                    * Mesa detectada automáticamente por QR
                                </p>
                            )}
                        </div>
                    )}

                    {/* PICKUP & DELIVERY COMMON FIELDS */}
                    {fulfillmentMethod !== 'dine_in' && (
                        <div>
                            <label className="block text-sm text-neutral-400 mb-1">Nombre Completo <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-neutral-600" size={18} />
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    className="w-full bg-black border border-neutral-700 rounded-lg p-3 pl-10 text-white focus:border-amber-500 outline-none"
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>
                        </div>
                    )}

                    {/* PICKUP SPECIFIC */}
                    {fulfillmentMethod === 'pickup' && (
                        <div>
                            <label className="block text-sm text-neutral-400 mb-1">Hora Estimada (Opcional)</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3 text-neutral-600" size={18} />
                                <input
                                    type="time"
                                    value={pickupTime}
                                    onChange={(e) => setPickupTime(e.target.value)}
                                    className="w-full bg-black border border-neutral-700 rounded-lg p-3 pl-10 text-white focus:border-amber-500 outline-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* DELIVERY SPECIFIC */}
                    {fulfillmentMethod === 'delivery' && (
                        <>
                            <div>
                                <label className="block text-sm text-neutral-400 mb-1">Zona de Entrega <span className="text-red-500">*</span></label>
                                <select
                                    value={deliveryZone}
                                    onChange={(e) => setDeliveryZone(e.target.value)}
                                    className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none appearance-none"
                                >
                                    <option value="">Selecciona una zona...</option>
                                    {restaurant.delivery_zones?.map((zone) => (
                                        <option key={zone} value={zone}>{zone}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-neutral-400 mb-1">Dirección Exacta <span className="text-red-500">*</span></label>
                                <textarea
                                    value={deliveryAddress}
                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                    className="w-full bg-black border border-neutral-700 rounded-lg p-3 text-white focus:border-amber-500 outline-none h-24 resize-none"
                                    placeholder="Calle, número de casa, referencias..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-neutral-400 mb-1">WhatsApp de Contacto <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <MessageCircle className="absolute left-3 top-3 text-neutral-600" size={18} />
                                    <input
                                        type="tel"
                                        value={whatsapp}
                                        onChange={(e) => setWhatsapp(e.target.value)}
                                        className="w-full bg-black border border-neutral-700 rounded-lg p-3 pl-10 text-white focus:border-amber-500 outline-none"
                                        placeholder="Para enviarte la ubicación si hace falta"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </section>

                {/* Order Summary */}
                <section>
                    <h2 className="text-xl font-bold text-amber-500 mb-4 border-b border-white/10 pb-2">Tu Pedido</h2>
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center bg-neutral-900/50 p-4 rounded-lg border border-white/5">
                                <div>
                                    <p className="font-bold">{item.name}</p>
                                    <p className="text-sm text-neutral-500">{formatCurrency(item.price)} x {item.quantity}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-lg">{formatCurrency(item.price * item.quantity)}</span>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="text-red-500 hover:text-red-400 text-xs"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-between items-center border-t border-dashed border-neutral-700 pt-4">
                        <span className="text-xl font-bold">Total</span>
                        <span className="text-2xl font-bold text-amber-500">{formatCurrency(cartTotal)}</span>
                    </div>
                </section>

                <div className="space-y-4 pt-4 border-t border-white/10">
                    {/* HIDE WhatsApp if Delivery */}
                    {fulfillmentMethod !== 'delivery' && (
                        <button
                            onClick={handleWhatsAppOrder}
                            disabled={isSubmitting}
                            className={`w-full font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 ${isSubmitting
                                ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-500 shadow-green-900/20 active:scale-[0.98]'
                                }`}
                        >
                            {isSubmitting ? <span>Procesando...</span> : <span>Pedir por WhatsApp</span>}
                        </button>
                    )}

                    {/* Delivery Notification */}
                    {fulfillmentMethod === 'delivery' && (
                        <div className="text-center text-xs text-amber-500 bg-amber-500/10 p-2 rounded-lg mb-2">
                            ⚠️ Para envíos a domicilio, requerimos pago con tarjeta para confirmar el despacho.
                        </div>
                    )}

                    <button
                        onClick={handleStripePayment}
                        disabled={isSubmitting}
                        className={`w-full font-bold py-4 rounded-xl transition shadow-lg flex items-center justify-center gap-2 ${isSubmitting
                            ? 'bg-neutral-700 text-neutral-400 cursor-not-allowed'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-900/20 active:scale-[0.98]'
                            }`}
                    >
                        {isSubmitting ? <span>Redirigiendo...</span> : <span>Pagar con Tarjeta</span>}
                    </button>
                    <p className="text-center text-[10px] text-neutral-500">
                        Al confirmar, aceptas nuestros términos y condiciones.
                    </p>
                </div>
            </main>
        </div>
    )
}

export default function CheckoutClient({ restaurant }: { restaurant: Restaurant }) {
    return (
        <CartProvider>
            <CheckoutForm restaurant={restaurant} />
        </CartProvider>
    )
}
