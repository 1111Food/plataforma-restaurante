'use client'

import { useState, useTransition } from 'react'
import { 
    Plus, 
    Save, 
    Trash2, 
    Eye, 
    EyeOff, 
    Globe, 
    Lock, 
    Store, 
    LogOut, 
    ExternalLink, 
    Search,
    RefreshCw,
    Activity,
    Database,
    Palette
} from 'lucide-react'
import { 
    logoutSuperAdmin, 
    updateRestaurantPassword, 
    updateRestaurantCustomDomain, 
    deleteRestaurant, 
    createRestaurant 
} from '../actions/auth'

type Restaurant = {
    id: string
    name: string
    slug: string
    admin_password?: string | null
    custom_domain?: string | null
    theme_color?: string | null
    created_at?: string
}

type Props = {
    initialRestaurants: Restaurant[]
}

export default function SuperAdminDashboardClient({ initialRestaurants }: Props) {
    const [restaurants, setRestaurants] = useState<Restaurant[]>(initialRestaurants)
    const [searchQuery, setSearchQuery] = useState('')
    const [isPending, startTransition] = useTransition()

    // Create Form States
    const [newName, setNewName] = useState('')
    const [newSlug, setNewSlug] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [createError, setCreateError] = useState<string | null>(null)
    const [createSuccess, setCreateSuccess] = useState<string | null>(null)

    // Inline edit states for passwords and domains
    const [editedPasswords, setEditedPasswords] = useState<Record<string, string>>({})
    const [editedDomains, setEditedDomains] = useState<Record<string, string>>({})
    const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({})

    // Auto-fill slug from name helper
    const handleNameChange = (val: string) => {
        setNewName(val)
        // Convert to slug format (lowercase, hyphens, alphanumeric only)
        const suggested = val
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
            .trim()
            .replace(/\s+/g, "-") // Spaces to hyphens
            .replace(/-+/g, "-")
        setNewSlug(suggested)
    }

    const handleLogout = () => {
        if (confirm('¿Cerrar sesión como Super-Administrador?')) {
            startTransition(async () => {
                await logoutSuperAdmin()
                window.location.reload()
            })
        }
    }

    const handleCreateRestaurant = (e: React.FormEvent) => {
        e.preventDefault()
        setCreateError(null)
        setCreateSuccess(null)

        if (!newName || !newSlug) {
            setCreateError('Nombre y Slug son requeridos.')
            return
        }

        startTransition(async () => {
            const res = await createRestaurant(newName, newSlug, newPassword)
            if (res.success && res.restaurant) {
                setRestaurants(prev => [...prev, res.restaurant!].sort((a,b) => a.name.localeCompare(b.name)))
                setCreateSuccess(`¡Restaurante "${newName}" creado con éxito!`)
                setNewName('')
                setNewSlug('')
                setNewPassword('')
            } else {
                setCreateError(res.error || 'Error al crear el restaurante. Verifica que el slug no esté en uso.')
            }
        })
    }

    const handleSavePassword = (restaurantId: string, slug: string) => {
        const passwordToSet = editedPasswords[restaurantId]
        if (passwordToSet === undefined) return

        startTransition(async () => {
            const res = await updateRestaurantPassword(restaurantId, slug, passwordToSet)
            if (res.success) {
                setRestaurants(prev => 
                    prev.map(r => r.id === restaurantId ? { ...r, admin_password: passwordToSet || null } : r)
                )
                alert(`Contraseña para /${slug} actualizada con éxito.`)
            } else {
                alert(`Error: ${res.error}`)
            }
        })
    }

    const handleSaveDomain = (restaurantId: string, slug: string) => {
        const domainToSet = editedDomains[restaurantId]
        if (domainToSet === undefined) return

        startTransition(async () => {
            const res = await updateRestaurantCustomDomain(restaurantId, slug, domainToSet)
            if (res.success) {
                setRestaurants(prev => 
                    prev.map(r => r.id === restaurantId ? { ...r, custom_domain: domainToSet || null } : r)
                )
                alert(`Dominio personalizado para /${slug} actualizado con éxito.`)
            } else {
                alert(`Error: ${res.error}`)
            }
        })
    }

    const handleDeleteRestaurant = (restaurantId: string, slug: string, name: string) => {
        const confirm1 = confirm(`¿Estás seguro de que deseas eliminar permanentemente a "${name}" (/${slug})?`)
        if (!confirm1) return

        const confirm2 = window.prompt(`ADVERTENCIA: Esta acción eliminará el restaurante, sus categorías, productos, eventos e historial. ¿Deseas proceder? Escribe el slug "${slug}" para confirmar:`)
        if (confirm2 !== slug) {
            alert('Confirmación cancelada. El slug ingresado no coincide.')
            return
        }

        startTransition(async () => {
            const res = await deleteRestaurant(restaurantId, slug)
            if (res.success) {
                setRestaurants(prev => prev.filter(r => r.id !== restaurantId))
                alert('Restaurante eliminado con éxito.')
            } else {
                alert(`Error al eliminar: ${res.error}`)
            }
        })
    }

    const filteredRestaurants = restaurants.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.custom_domain && r.custom_domain.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const totalDomains = restaurants.filter(r => r.custom_domain).length

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-amber-500 selection:text-black">
            
            {/* Top Navigation */}
            <header className="bg-black border-b border-neutral-900 sticky top-0 z-50 px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center font-black text-black italic tracking-tighter text-xl">
                        11:11
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold tracking-tight text-lg">GODMODE CONSOLE</span>
                            <span className="bg-red-500/10 text-red-500 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-red-500/20">
                                SUPERADMIN
                            </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest">Platform Management Suite</p>
                    </div>
                </div>

                <button 
                    onClick={handleLogout}
                    disabled={isPending}
                    className="flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 hover:text-red-400 border border-neutral-800 px-4 py-2 rounded-xl transition cursor-pointer text-sm font-semibold disabled:opacity-50"
                >
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                </button>
            </header>

            {/* Main Area */}
            <main className="p-8 max-w-7xl mx-auto space-y-8">
                
                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-neutral-900/30 border border-neutral-800 p-6 rounded-3xl flex items-center gap-4 relative overflow-hidden">
                        <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 flex-shrink-0">
                            <Store size={22} />
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Total de Clientes</p>
                            <h3 className="text-3xl font-extrabold mt-1">{restaurants.length}</h3>
                        </div>
                        <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-5 pointer-events-none">
                            <Store size={80} />
                        </div>
                    </div>

                    <div className="bg-neutral-900/30 border border-neutral-800 p-6 rounded-3xl flex items-center gap-4 relative overflow-hidden">
                        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 flex-shrink-0">
                            <Globe size={22} />
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Dominios Vinculados</p>
                            <h3 className="text-3xl font-extrabold mt-1">{totalDomains}</h3>
                        </div>
                        <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-5 pointer-events-none">
                            <Globe size={80} />
                        </div>
                    </div>

                    <div className="bg-neutral-900/30 border border-neutral-800 p-6 rounded-3xl flex items-center gap-4 relative overflow-hidden">
                        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 flex-shrink-0">
                            <Activity size={22} className="animate-pulse" />
                        </div>
                        <div>
                            <p className="text-xs text-neutral-500 uppercase font-bold tracking-wider">Servicio de Hosting</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute"></span>
                                <span className="w-3 h-3 bg-emerald-500 rounded-full relative"></span>
                                <h3 className="text-md font-extrabold uppercase text-emerald-400 tracking-wider">Online</h3>
                            </div>
                        </div>
                        <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-5 pointer-events-none">
                            <Database size={80} />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* Left Column: Create New Client */}
                    <div className="lg:col-span-1 bg-neutral-900/20 border border-neutral-800 rounded-3xl p-6 space-y-6">
                        <div>
                            <h2 className="text-xl font-extrabold tracking-tight">Agregar Nuevo Cliente</h2>
                            <p className="text-xs text-neutral-500 mt-1">Crea una nueva instancia de restaurante en la base de datos de manera inmediata.</p>
                        </div>

                        <form onSubmit={handleCreateRestaurant} className="space-y-4">
                            {createError && (
                                <div className="text-xs bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl">
                                    {createError}
                                </div>
                            )}

                            {createSuccess && (
                                <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl">
                                    {createSuccess}
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider pl-1">Nombre del Restaurante</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ej. Burguer & Beers 1111"
                                    className="w-full bg-neutral-950 border border-neutral-800/80 p-3.5 rounded-xl focus:border-amber-500 outline-none transition text-white text-sm"
                                    value={newName}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider pl-1">Slug de Ruta (Único)</label>
                                <div className="relative">
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-600 text-xs font-mono">/</span>
                                    <input
                                        type="text"
                                        required
                                        placeholder="burguer-beers-1111"
                                        className="w-full bg-neutral-950 border border-neutral-800/80 p-3.5 pl-7 rounded-xl focus:border-amber-500 outline-none transition text-white font-mono text-sm"
                                        value={newSlug}
                                        onChange={(e) => setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                    />
                                </div>
                                <p className="text-[10px] text-neutral-600 pl-1">Será la URL de acceso: menu1111.app/<b>slug</b></p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-neutral-400 font-bold uppercase tracking-wider pl-1">Contraseña Inicial del Cliente</label>
                                <input
                                    type="text"
                                    placeholder="Ej: clave123"
                                    className="w-full bg-neutral-950 border border-neutral-800/80 p-3.5 rounded-xl focus:border-amber-500 outline-none transition text-white text-sm font-mono"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full bg-white text-black font-extrabold py-3.5 px-6 rounded-xl hover:bg-neutral-200 transition cursor-pointer flex items-center justify-center gap-2 text-sm shadow-md disabled:opacity-50"
                            >
                                <Plus size={16} />
                                <span>Crear Instancia</span>
                            </button>
                        </form>
                    </div>

                    {/* Right Column: Client Manager */}
                    <div className="lg:col-span-2 space-y-4">
                        
                        {/* Search & Filter Header */}
                        <div className="bg-neutral-900/10 border border-neutral-800 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                                <span>Administrar Instancias</span>
                                <span className="bg-neutral-800 text-neutral-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                    {filteredRestaurants.length}
                                </span>
                            </h2>
                            <div className="relative max-w-sm w-full">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar por nombre, slug o dominio..."
                                    className="w-full bg-neutral-950 border border-neutral-850 p-2.5 pl-10 rounded-xl focus:border-amber-500 outline-none transition text-white text-xs placeholder-neutral-600"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* List Grid */}
                        <div className="space-y-4">
                            {filteredRestaurants.length === 0 ? (
                                <div className="bg-neutral-900/10 border border-neutral-800 rounded-3xl p-12 text-center text-neutral-500 text-sm">
                                    No se encontraron restaurantes con los criterios de búsqueda.
                                </div>
                            ) : (
                                filteredRestaurants.map((restaurant) => {
                                    const rawPassword = editedPasswords[restaurant.id] !== undefined 
                                        ? editedPasswords[restaurant.id] 
                                        : (restaurant.admin_password || '')

                                    const rawDomain = editedDomains[restaurant.id] !== undefined
                                        ? editedDomains[restaurant.id]
                                        : (restaurant.custom_domain || '')

                                    const isPasswordVisible = visiblePasswords[restaurant.id] || false

                                    const hasPasswordChanged = editedPasswords[restaurant.id] !== undefined && 
                                        editedPasswords[restaurant.id] !== (restaurant.admin_password || '')

                                    const hasDomainChanged = editedDomains[restaurant.id] !== undefined &&
                                        editedDomains[restaurant.id] !== (restaurant.custom_domain || '')

                                    return (
                                        <div 
                                            key={restaurant.id}
                                            className="bg-neutral-900/30 border border-neutral-850 rounded-3xl p-6 hover:border-neutral-700/80 transition-colors flex flex-col gap-6"
                                        >
                                            {/* Header of Item */}
                                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800/50 pb-4">
                                                <div className="flex items-center gap-3">
                                                    {/* Color indicator */}
                                                    <div 
                                                        className="w-4 h-4 rounded-full border border-white/10 shadow-sm"
                                                        style={{ backgroundColor: restaurant.theme_color || '#FFB800' }}
                                                        title="Color del tema"
                                                    ></div>
                                                    <div>
                                                        <h3 className="font-extrabold text-lg flex items-center gap-2">
                                                            <span>{restaurant.name}</span>
                                                        </h3>
                                                        <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-0.5">
                                                            <span>Slug:</span>
                                                            <span className="text-amber-500">/{restaurant.slug}</span>
                                                            <div className="flex items-center gap-1.5 ml-2">
                                                                <a 
                                                                    href={`/${restaurant.slug}`} 
                                                                    target="_blank" 
                                                                    className="text-neutral-400 hover:text-white transition flex items-center gap-0.5"
                                                                    title="Ver Menú Público"
                                                                >
                                                                    <ExternalLink size={10} />
                                                                    <span className="text-[10px]">Menú</span>
                                                                </a>
                                                                <span className="text-neutral-700">•</span>
                                                                <a 
                                                                    href={`/${restaurant.slug}/admin`} 
                                                                    target="_blank" 
                                                                    className="text-neutral-400 hover:text-white transition flex items-center gap-0.5"
                                                                    title="Ir a Admin"
                                                                >
                                                                    <Lock size={10} />
                                                                    <span className="text-[10px]">Admin</span>
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => handleDeleteRestaurant(restaurant.id, restaurant.slug, restaurant.name)}
                                                    className="p-2.5 rounded-xl border border-red-500/10 text-red-500 hover:bg-red-500 hover:text-black transition cursor-pointer self-start"
                                                    title="Eliminar restaurante"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            {/* Forms Area */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                
                                                {/* Password Edit Box */}
                                                <div className="space-y-2">
                                                    <label className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider pl-1 flex items-center gap-1">
                                                        <Lock size={12} className="text-neutral-500" />
                                                        <span>Contraseña Admin del Cliente</span>
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <div className="relative flex-1">
                                                            <input
                                                                type={isPasswordVisible ? 'text' : 'password'}
                                                                placeholder="Sin contraseña (público)"
                                                                className="w-full bg-neutral-950 border border-neutral-800 p-2.5 pr-10 rounded-xl focus:border-amber-500 outline-none transition text-xs font-mono"
                                                                value={rawPassword}
                                                                onChange={(e) => setEditedPasswords(prev => ({ ...prev, [restaurant.id]: e.target.value }))}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setVisiblePasswords(prev => ({ ...prev, [restaurant.id]: !isPasswordVisible }))}
                                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition"
                                                            >
                                                                {isPasswordVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                                                            </button>
                                                        </div>
                                                        <button
                                                            disabled={!hasPasswordChanged || isPending}
                                                            onClick={() => handleSavePassword(restaurant.id, restaurant.slug)}
                                                            className={`
                                                                px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer
                                                                ${hasPasswordChanged 
                                                                    ? 'bg-amber-500 text-black hover:bg-amber-400' 
                                                                    : 'bg-neutral-850 text-neutral-600 border border-neutral-800 cursor-not-allowed'}
                                                            `}
                                                        >
                                                            <Save size={14} />
                                                            <span className="hidden sm:inline">Guardar</span>
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Domain Edit Box */}
                                                <div className="space-y-2">
                                                    <label className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider pl-1 flex items-center gap-1">
                                                        <Globe size={12} className="text-neutral-500" />
                                                        <span>Dominio Personalizado</span>
                                                    </label>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="ej. restaurante.com"
                                                            className="w-full bg-neutral-950 border border-neutral-800 p-2.5 rounded-xl focus:border-amber-500 outline-none transition text-xs font-mono flex-1"
                                                            value={rawDomain}
                                                            onChange={(e) => setEditedDomains(prev => ({ ...prev, [restaurant.id]: e.target.value }))}
                                                        />
                                                        <button
                                                            disabled={!hasDomainChanged || isPending}
                                                            onClick={() => handleSaveDomain(restaurant.id, restaurant.slug)}
                                                            className={`
                                                                px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer
                                                                ${hasDomainChanged 
                                                                    ? 'bg-amber-500 text-black hover:bg-amber-400' 
                                                                    : 'bg-neutral-850 text-neutral-600 border border-neutral-800 cursor-not-allowed'}
                                                            `}
                                                        >
                                                            <Save size={14} />
                                                            <span className="hidden sm:inline">Guardar</span>
                                                        </button>
                                                    </div>
                                                </div>

                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                    </div>
                </div>

            </main>
        </div>
    )
}
