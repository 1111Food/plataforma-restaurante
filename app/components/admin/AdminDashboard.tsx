'use client'

import { useState, useTransition } from 'react'
import OverviewTab from './tabs/OverviewTab'
import MenuTab from './tabs/MenuTab'
import EventsTab from './tabs/EventsTab'
import ConfigTab from './tabs/ConfigTab'
import QRTab from './tabs/QRTab'
import { LayoutDashboard, Calendar, Settings, ExternalLink, QrCode, ChefHat, PieChart, LogOut } from 'lucide-react'
import Link from 'next/link'
import { logoutAdmin } from '../../actions/auth'

type Props = {
    restaurant: any
}

export default function AdminDashboard({ restaurant }: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'events' | 'config' | 'qr'>('overview')
    const [isPending, startTransition] = useTransition()

    const handleLogout = () => {
        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
            startTransition(async () => {
                await logoutAdmin(restaurant.slug)
                window.location.reload()
            })
        }
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex">
            {/* Sidebar */}
            <aside className="w-20 lg:w-64 bg-black border-r border-white/5 flex flex-col sticky top-0 h-screen">
                <div className="p-6 flex items-center justify-center lg:justify-start gap-3">
                    <div className="w-8 h-8 bg-amber-500 rounded-full flex-shrink-0"></div>
                    <span className="hidden lg:block font-bold tracking-widest text-lg">ADMIN</span>
                </div>

                <nav className="flex-1 py-8 flex flex-col gap-2 px-2">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`flex items-center gap-3 p-3 rounded-xl transition ${activeTab === 'overview' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:bg-white/5'}`}
                    >
                        <PieChart size={20} />
                        <span className="hidden lg:block">Resumen</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('menu')}
                        className={`flex items-center gap-3 p-3 rounded-xl transition ${activeTab === 'menu' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:bg-white/5'}`}
                    >
                        <LayoutDashboard size={20} />
                        <span className="hidden lg:block">Menú Digital</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('events')}
                        className={`flex items-center gap-3 p-3 rounded-xl transition ${activeTab === 'events' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:bg-white/5'}`}
                    >
                        <Calendar size={20} />
                        <span className="hidden lg:block">Eventos</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('qr')}
                        className={`flex items-center gap-3 p-3 rounded-xl transition ${activeTab === 'qr' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:bg-white/5'}`}
                    >
                        <QrCode size={20} />
                        <span className="hidden lg:block">Código QR</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('config')}
                        className={`flex items-center gap-3 p-3 rounded-xl transition ${activeTab === 'config' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:bg-white/5'}`}
                    >
                        <Settings size={20} />
                        <span className="hidden lg:block">Configuración</span>
                    </button>
                    <Link
                        href={`/${restaurant.slug}/admin/kitchen`}
                        target="_blank"
                        className="flex items-center gap-3 p-3 rounded-xl transition text-neutral-400 hover:bg-white/5 hover:text-white"
                    >
                        <ChefHat size={20} />
                        <span className="hidden lg:block">Pantalla Cocina</span>
                    </Link>
                </nav>

                <div className="p-4 border-t border-white/5 flex flex-col gap-2">
                    <Link href={`/${restaurant.slug}`} target="_blank" className="flex items-center gap-3 text-neutral-500 hover:text-white transition p-2 flex-shrink-0">
                        <ExternalLink size={20} />
                        <span className="hidden lg:block">Ver Menú Público</span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        disabled={isPending}
                        className="flex items-center gap-3 text-red-500 hover:text-red-400 hover:bg-red-500/5 transition p-2 rounded-xl cursor-pointer w-full text-left font-medium flex-shrink-0"
                    >
                        <LogOut size={20} className={isPending ? 'animate-pulse' : ''} />
                        <span className="hidden lg:block">{isPending ? 'Saliendo...' : 'Cerrar Sesión'}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
                <header className="mb-12">
                    <h2 className="text-3xl font-bold mb-2">
                        {activeTab === 'overview' && 'Panel de Control'}
                        {activeTab === 'menu' && 'Gestión del Menú'}
                        {activeTab === 'events' && 'Eventos y Promociones'}
                        {activeTab === 'qr' && 'Generador de QR'}
                        {activeTab === 'config' && 'Configuración General'}
                    </h2>
                    <p className="text-neutral-500">
                        Administrando: <span className="text-amber-500">{restaurant.name}</span>
                    </p>
                </header>

                <div className="max-w-4xl">
                    {activeTab === 'overview' && <OverviewTab restaurant={restaurant} />}
                    {activeTab === 'menu' && <MenuTab restaurant={restaurant} />}
                    {activeTab === 'events' && <EventsTab restaurant={restaurant} />}
                    {activeTab === 'qr' && <QRTab restaurant={restaurant} />}
                    {activeTab === 'config' && <ConfigTab restaurant={restaurant} />}
                </div>
            </main>
        </div>
    )
}
