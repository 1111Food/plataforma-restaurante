'use client'

import React, { useEffect, useState, useRef } from 'react'
import { createClient } from '@supabase/supabase-js'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, Bike, Utensils, ShoppingBag, CheckCircle, Flame, ChefHat, Bell, Volume2, AlertCircle } from 'lucide-react'

// Initialize Supabase Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type OrderItem = {
    id: string
    name: string
    quantity: number
    modifiers?: any[]
}

type Order = {
    id: number
    created_at: string
    customer_name: string
    table_number?: string
    fulfillment_method: 'dine_in' | 'pickup' | 'delivery'
    delivery_zone?: string
    notes?: string
    status: 'paid' | 'pending_whatsapp' | 'cooking' | 'ready' | 'delivered'
    items: OrderItem[]
    total_amount: number
}

// Reliable Audio Source
const NOTIFICATION_SOUND_URL = "https://cdn.freesound.org/previews/316/316847_4939433-lq.mp3";

export default function KitchenClient({ restaurant }: { restaurant: { id: string, name: string } }) {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [lastUpated, setLastUpdated] = useState(new Date())
    const [audioError, setAudioError] = useState(false) // Track if autoplay failed
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialize Audio
    useEffect(() => {
        audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    }, []);

    const playNotificationSound = async () => {
        if (!audioRef.current) return;
        try {
            audioRef.current.currentTime = 0;
            await audioRef.current.play();
            setAudioError(false); // Reset error if successful
        } catch (e) {
            console.error("Audio play failed (likely autoplay policy):", e);
            setAudioError(true);
        }
    }

    // Initial Fetch
    const fetchOrders = async () => {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('restaurant_id', restaurant.id)
            .in('status', ['paid', 'pending_whatsapp', 'cooking', 'ready']) // Filter active orders
            .order('created_at', { ascending: true })

        if (error) console.error('Error fetching orders:', error)
        else setOrders(data as Order[])
        setLoading(false)
    }

    // Realtime Subscription
    useEffect(() => {
        fetchOrders()

        const channel = supabase
            .channel('kitchen-orders')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT and UPDATE
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurant.id}`
                },
                (payload) => {
                    console.log('Realtime change:', payload)

                    if (payload.eventType === 'INSERT') {
                        // New order logic
                        const newOrder = payload.new as Order
                        if (['paid', 'pending_whatsapp'].includes(newOrder.status)) {
                            playNotificationSound()
                            setOrders((prev) => [...prev, newOrder])
                        }
                    } else if (payload.eventType === 'UPDATE') {
                        const updatedOrder = payload.new as Order
                        // Remove if completed/delivered (unless we want to show them for a bit?)
                        // User requirement: ". Delivered -> hide ticket"
                        if (updatedOrder.status === 'delivered' || updatedOrder.status === 'cancelled') {
                            setOrders((prev) => prev.filter(o => o.id !== updatedOrder.id))
                        } else {
                            // Update existing
                            setOrders((prev) => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
                        }
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [restaurant.id])

    // Timer effect to update "time ago" display
    useEffect(() => {
        const interval = setInterval(() => setLastUpdated(new Date()), 60000) // Update UI every minute
        return () => clearInterval(interval)
    }, [])

    const updateStatus = async (orderId: number, newStatus: string) => {
        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId)

        if (error) {
            alert('Error updating status')
            console.error(error)
        } else {
            // Optimistic update
            if (newStatus === 'delivered') {
                setOrders((prev) => prev.filter(o => o.id !== orderId))
            } else {
                setOrders((prev) => prev.map(o => o.id === orderId ? { ...o, status: newStatus } as Order : o))
            }
        }
    }

    const getElapsedTimeColor = (dateStr: string) => {
        const diff = new Date().getTime() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes > 20) return 'text-red-500 animate-pulse';
        if (minutes > 10) return 'text-yellow-500';
        return 'text-green-500';
    }

    if (loading) return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">Cargando KDS...</div>

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans p-4">

            {/* AUTOPLAY ERROR TOAST */}
            {audioError && (
                <div
                    onClick={playNotificationSound}
                    className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-amber-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-4 cursor-pointer animate-bounce border-2 border-white"
                >
                    <AlertCircle size={24} />
                    <div className="flex flex-col">
                        <span className="font-bold text-lg">¡NUEVA ORDEN!</span>
                        <span className="text-xs">Haz clic aquí para activar el sonido</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b border-white/10 gap-4">
                <div className="flex items-center gap-4">
                    <ChefHat className="text-amber-500" size={32} />
                    <h1 className="text-2xl font-bold uppercase tracking-widest">Cocina | {restaurant.name}</h1>
                </div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={playNotificationSound}
                        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded-full transition border border-white/10"
                        title="Probar sonido"
                    >
                        <Volume2 size={18} className="text-amber-500" />
                        <span className="text-sm font-bold text-neutral-300">Probar Sonido</span>
                    </button>
                    <div className="text-right">
                        <p className="text-xs text-neutral-500 uppercase">Órdenes Activas</p>
                        <p className="text-2xl font-bold text-amber-500">{orders.length}</p>
                    </div>
                </div>
            </header>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {orders.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-30">
                        <Utensils size={64} className="mb-4" />
                        <h2 className="text-xl font-bold">Todo tranquilo en la cocina...</h2>
                    </div>
                )}

                {orders.map((order) => (
                    <div key={order.id} className={`bg-neutral-900 border ${order.status === 'ready' ? 'border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'border-white/10'} rounded-xl overflow-hidden flex flex-col h-full transition-all`}>
                        {/* Ticket Header */}
                        <div className={`p-4 flex justify-between items-start ${order.fulfillment_method === 'delivery' ? 'bg-blue-900/20' :
                            order.fulfillment_method === 'pickup' ? 'bg-purple-900/20' :
                                'bg-amber-900/20'
                            }`}>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-xl font-bold">#{order.id}</span>
                                    {order.fulfillment_method === 'delivery' && <Bike size={18} className="text-blue-400" />}
                                    {order.fulfillment_method === 'pickup' && <ShoppingBag size={18} className="text-purple-400" />}
                                    {order.fulfillment_method === 'dine_in' && <Utensils size={18} className="text-amber-400" />}
                                </div>
                                <p className="font-bold text-sm">
                                    {order.fulfillment_method === 'dine_in' ? `Mesa ${order.table_number}` : order.customer_name}
                                </p>
                                {order.delivery_zone && <p className="text-xs text-neutral-400 mt-1">{order.delivery_zone}</p>}
                            </div>
                            <div className="text-right">
                                <div className={`flex items-center justify-end gap-1 font-mono text-sm font-bold ${getElapsedTimeColor(order.created_at)}`}>
                                    <Clock size={14} />
                                    {formatDistanceToNow(new Date(order.created_at), { locale: es, addSuffix: false }).replace('alrededor de ', '')}
                                </div>
                                <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded uppercase ${order.status === 'cooking' ? 'bg-orange-500/20 text-orange-400' :
                                    order.status === 'ready' ? 'bg-green-500/20 text-green-400' :
                                        'bg-neutral-700 text-neutral-300'
                                    }`}>
                                    {order.status === 'pending_whatsapp' ? 'Pendiente' :
                                        order.status === 'paid' ? 'Pagado' :
                                            order.status === 'cooking' ? 'Cocinando' :
                                                order.status === 'ready' ? 'Listo' : order.status}
                                </span>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="p-4 flex-1 space-y-3 overflow-y-auto max-h-[300px]">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex gap-3 border-b border-white/5 last:border-0 pb-2 last:pb-0">
                                    <span className="font-bold text-lg w-6 shrink-0 text-center bg-white/5 rounded h-8 leading-8">{item.quantity}</span>
                                    <div>
                                        <p className="font-medium leading-snug">{item.name}</p>
                                        {item.modifiers && item.modifiers.length > 0 && (
                                            <div className="text-xs text-neutral-400 mt-1 space-y-0.5">
                                                {item.modifiers.map((mod: any, mIdx: number) => (
                                                    <span key={mIdx} className="block text-amber-500/80">• {mod.name}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {order.notes && (
                                <div className="bg-red-900/20 border border-red-500/30 p-2 rounded text-xs text-red-200 mt-2">
                                    <span className="font-bold block mb-1">Notas:</span>
                                    {order.notes}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="p-2 grid grid-cols-1 gap-2 bg-black/20 mt-auto">
                            {(order.status === 'paid' || order.status === 'pending_whatsapp') && (
                                <button
                                    onClick={() => updateStatus(order.id, 'cooking')}
                                    className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition"
                                >
                                    <Flame size={20} /> COCINAR
                                </button>
                            )}

                            {order.status === 'cooking' && (
                                <button
                                    onClick={() => updateStatus(order.id, 'ready')}
                                    className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition"
                                >
                                    <CheckCircle size={20} /> LISTO
                                </button>
                            )}

                            {order.status === 'ready' && (
                                <button
                                    onClick={() => updateStatus(order.id, 'delivered')}
                                    className="w-full py-4 bg-neutral-700 hover:bg-neutral-600 text-neutral-300 font-bold rounded-lg flex items-center justify-center gap-2 transition"
                                >
                                    ENTREGADO / BORRAR
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
