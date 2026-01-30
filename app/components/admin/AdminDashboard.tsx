'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import OverviewTab from './tabs/OverviewTab'
import MenuTab from './tabs/MenuTab'
import EventsTab from './tabs/EventsTab'
import ConfigTab from './tabs/ConfigTab'
import QRTab from './tabs/QRTab'
import { LayoutDashboard, Calendar, Settings, ExternalLink, Lock, UserPlus, QrCode, ChefHat, PieChart } from 'lucide-react'
import Link from 'next/link'

// Initialize Supabase Client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type Props = {
    restaurant: any
}

export default function AdminDashboard({ restaurant }: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'events' | 'config' | 'qr'>('overview')
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [password, setPassword] = useState('')
    const [isRegistering, setIsRegistering] = useState(false) // Toggle Login vs Register
    const [isLoading, setIsLoading] = useState(false)

    // Login Handler
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        if (restaurant.admin_password && password === restaurant.admin_password) {
            setIsAuthenticated(true)
        } else {
            alert('Contraseña incorrecta')
        }
    }

    // Register / Claim Handler
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!password) {
            alert('Por favor ingresa una contraseña')
            return
        }

        setIsLoading(true)

        try {
            // Update the restaurant record with the new password
            const { error } = await supabase
                .from('restaurants')
                .update({ admin_password: password })
                .eq('id', restaurant.id)

            if (error) throw error

            alert('¡Restaurante reclamado con éxito! Ahora eres el administrador.')
            // Update local state to reflect the new password (so login works implicitly)
            restaurant.admin_password = password
            setIsAuthenticated(true)

        } catch (error: any) {
            console.error('Registration error:', error)
            alert('Error al registrar: ' + error.message)
        } finally {
            setIsLoading(false)
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6">
                <div className="w-full max-w-sm">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold tracking-widest mb-2">
                            {isRegistering ? 'CONFIGURAR ACCESO' : '11:11 STUDIO ADMIN'}
                        </h1>
                        <p className="text-neutral-500 text-sm">
                            {isRegistering
                                ? `Reclamando propiedad de: ${restaurant.name}`
                                : `Administrando: ${restaurant.name}`}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={isRegistering ? handleRegister : handleLogin} className="flex flex-col gap-4">
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
                            <input
                                type="password"
                                placeholder={isRegistering ? "Crea tu Contraseña Maestra" : "Contraseña de acceso"}
                                className="w-full bg-neutral-900 border border-neutral-800 p-4 pl-12 rounded-xl focus:border-amber-500 outline-none transition text-white placeholder-neutral-600"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            disabled={isLoading}
                            className={`
                                font-bold py-4 rounded-xl transition flex items-center justify-center gap-2
                                ${isRegistering
                                    ? 'bg-amber-500 text-black hover:bg-amber-400'
                                    : 'bg-white text-black hover:bg-neutral-200'}
                            `}
                        >
                            {isLoading ? 'Procesando...' : (isRegistering ? 'Reclamar & Entrar' : 'Entrar')}
                        </button>
                    </form>

                    {/* Toggle Mode */}
                    <div className="mt-8 text-center space-y-4">
                        <button
                            onClick={() => {
                                setIsRegistering(!isRegistering)
                                setPassword('')
                            }}
                            className="text-sm text-neutral-400 hover:text-white transition underline decoration-neutral-800 underline-offset-4"
                        >
                            {isRegistering
                                ? "¿Ya tienes cuenta? Iniciar Sesión"
                                : "¿Nuevo Restaurante? Regístrate aquí"}
                        </button>

                        <div className="block">
                            <Link href={`/${restaurant.slug}`} className="text-xs text-neutral-600 hover:text-neutral-400 transition">
                                ← Volver al menú público
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
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

                <div className="p-4 border-t border-white/5">
                    <Link href={`/${restaurant.slug}`} target="_blank" className="flex items-center gap-3 text-neutral-500 hover:text-white transition p-2">
                        <ExternalLink size={20} />
                        <span className="hidden lg:block">Ver Menú Público</span>
                    </Link>
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
