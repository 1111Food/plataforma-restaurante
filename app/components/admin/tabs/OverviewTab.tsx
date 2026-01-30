'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { formatCurrency } from '../../../utils/formatCurrency'
import { DollarSign, ShoppingBag, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { startOfDay, endOfDay, isToday, parseISO } from 'date-fns'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Order = {
    id: number
    created_at: string
    total_amount: number
    status: string
    fulfillment_method: string
    customer_name: string
    items: any[]
}

export default function OverviewTab({ restaurant }: { restaurant: any }) {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)

    // KPIs
    const [salesToday, setSalesToday] = useState(0)
    const [ordersToday, setOrdersToday] = useState(0)
    const [avgTicket, setAvgTicket] = useState(0)

    // Top Products
    const [topProducts, setTopProducts] = useState<{ name: string, count: number, percentage: number }[]>([])

    // Channels
    const [channels, setChannels] = useState<{ name: string, count: number, percentage: number }[]>([])

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true)

            // Fetch all orders for this restaurant (Optimize: Limit to this month/year if needed later)
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .neq('status', 'cancelled') // Exclude cancelled
                .order('created_at', { ascending: false })

            if (error) {
                console.error("Error fetching analytics:", error)
                setLoading(false)
                return
            }

            const allOrders = data as Order[] || []
            setOrders(allOrders)

            // --- CALCULATE METRICS ---

            // 1. TODAY'S METRICS
            const todayOrders = allOrders.filter(o => isToday(parseISO(o.created_at)))
            const todaySales = todayOrders.reduce((acc, o) => acc + o.total_amount, 0)

            setSalesToday(todaySales)
            setOrdersToday(todayOrders.length)
            setAvgTicket(todayOrders.length > 0 ? todaySales / todayOrders.length : 0)

            // 2. TOP PRODUCTS (All Time)
            const productMap: Record<string, number> = {}
            let totalItemsSold = 0

            allOrders.forEach(order => {
                if (Array.isArray(order.items)) {
                    order.items.forEach((item: any) => {
                        productMap[item.name] = (productMap[item.name] || 0) + (item.quantity || 1)
                        totalItemsSold += (item.quantity || 1)
                    })
                }
            })

            const sortedProducts = Object.entries(productMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({
                    name,
                    count,
                    percentage: totalItemsSold > 0 ? (count / totalItemsSold) * 100 : 0
                }))

            setTopProducts(sortedProducts)

            // 3. CHANNEL BREAKDOWN (All Time)
            const channelMap: Record<string, number> = {
                'dine_in': 0,
                'pickup': 0,
                'delivery': 0
            }
            let totalOrdersCount = allOrders.length

            allOrders.forEach(o => {
                if (channelMap[o.fulfillment_method] !== undefined) {
                    channelMap[o.fulfillment_method]++
                }
            })

            const channelStats = Object.entries(channelMap).map(([key, count]) => ({
                name: key === 'dine_in' ? 'Mesa' : key === 'pickup' ? 'Pick-up' : 'Delivery',
                count,
                percentage: totalOrdersCount > 0 ? (count / totalOrdersCount) * 100 : 0
            }))

            setChannels(channelStats)

            setLoading(false)
        }

        fetchData()
    }, [restaurant.id])

    if (loading) return <div className="text-center py-20 text-neutral-500 animate-pulse">Calculando métricas...</div>

    return (
        <div className="space-y-8 animate-fade-in">
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-neutral-900 border border-white/5 p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <DollarSign size={64} className="text-green-500" />
                    </div>
                    <h3 className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-1">Ventas de Hoy</h3>
                    <p className="text-3xl font-bold text-white">{formatCurrency(salesToday)}</p>
                    <div className="flex items-center gap-1 mt-2 text-xs text-green-500">
                        <ArrowUpRight size={14} />
                        <span>Actualizado en tiempo real</span>
                    </div>
                </div>

                <div className="bg-neutral-900 border border-white/5 p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <ShoppingBag size={64} className="text-blue-500" />
                    </div>
                    <h3 className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-1">Pedidos Hoy</h3>
                    <p className="text-3xl font-bold text-white">{ordersToday}</p>
                    <p className="text-xs text-neutral-500 mt-2">Órdenes procesadas</p>
                </div>

                <div className="bg-neutral-900 border border-white/5 p-6 rounded-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition">
                        <TrendingUp size={64} className="text-amber-500" />
                    </div>
                    <h3 className="text-neutral-400 text-sm font-medium uppercase tracking-wider mb-1">Ticket Promedio</h3>
                    <p className="text-3xl font-bold text-white">{formatCurrency(avgTicket)}</p>
                    <p className="text-xs text-neutral-500 mt-2">Promedio por cliente hoy</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* TOP PRODUCTS */}
                <div className="bg-neutral-900 border border-white/5 p-6 rounded-xl">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <ShoppingBag size={20} className="text-amber-500" />
                        Top Productos (Mes)
                    </h3>
                    <div className="space-y-4">
                        {topProducts.map((product, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-neutral-300">{product.name}</span>
                                    <span className="text-neutral-500 font-mono">{product.count} unds</span>
                                </div>
                                <div className="w-full bg-black rounded-full h-2 overflow-hidden">
                                    <div
                                        className="bg-amber-500 h-full rounded-full"
                                        style={{ width: `${product.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {topProducts.length === 0 && <p className="text-neutral-500 text-sm">No hay suficientes datos aún.</p>}
                    </div>
                </div>

                {/* CHANNEL BREAKDOWN */}
                <div className="bg-neutral-900 border border-white/5 p-6 rounded-xl">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <Clock size={20} className="text-blue-500" />
                        Canales de Venta
                    </h3>
                    <div className="space-y-6">
                        {channels.map((channel, idx) => (
                            <div key={idx} className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${channel.name === 'Delivery' ? 'bg-blue-500' :
                                        channel.name === 'Pick-up' ? 'bg-purple-500' : 'bg-amber-500'
                                    }`}></div>
                                <div className="flex-1">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">{channel.name}</span>
                                        <span className="text-xs text-neutral-400">{channel.count} pedidos</span>
                                    </div>
                                    <div className="w-full bg-black rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${channel.name === 'Delivery' ? 'bg-blue-500' :
                                                    channel.name === 'Pick-up' ? 'bg-purple-500' : 'bg-amber-500'
                                                }`}
                                            style={{ width: `${channel.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <span className="text-sm font-bold min-w-[3rem] text-right">{channel.percentage.toFixed(0)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RECENT ORDERS TABLE */}
            <div className="bg-neutral-900 border border-white/5 rounded-xl overflow-hidden">
                <div className="p-6 border-b border-white/5">
                    <h3 className="font-bold text-lg">Últimas Transacciones</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-black text-neutral-500 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">ID</th>
                                <th className="px-6 py-4">Cliente / Mesa</th>
                                <th className="px-6 py-4">Monto</th>
                                <th className="px-6 py-4">Canal</th>
                                <th className="px-6 py-4">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {orders.slice(0, 5).map((order) => (
                                <tr key={order.id} className="hover:bg-white/5 transition">
                                    <td className="px-6 py-4 font-mono text-neutral-400">#{order.id}</td>
                                    <td className="px-6 py-4 font-medium">{order.customer_name || 'Anónimo'}</td>
                                    <td className="px-6 py-4">{formatCurrency(order.total_amount)}</td>
                                    <td className="px-6 py-4 capitalize">
                                        {order.fulfillment_method === 'dine_in' ? 'Mesa' : order.fulfillment_method}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${order.status === 'paid' ? 'bg-green-500/20 text-green-500' :
                                                order.status === 'pending_whatsapp' ? 'bg-yellow-500/20 text-yellow-500' :
                                                    'bg-neutral-800 text-neutral-400'
                                            }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {orders.length === 0 && <div className="p-8 text-center text-neutral-500">No hay transacciones recientes.</div>}
                </div>
            </div>
        </div>
    )
}
