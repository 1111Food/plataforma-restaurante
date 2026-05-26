'use client'

import { useState, useTransition } from 'react'
import { Lock, ArrowRight, Eye, EyeOff, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { loginAdmin } from '../../actions/auth'

type Props = {
    slug: string
    restaurantName: string
    logoUrl?: string | null
}

export default function AdminLoginForm({ slug, restaurantName, logoUrl }: Props) {
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!password) {
            setError('Por favor ingresa tu contraseña.')
            return
        }

        startTransition(async () => {
            const res = await loginAdmin(slug, password)
            if (res.success) {
                // Reload page to let server-side check read the new secure cookie
                window.location.reload()
            } else {
                setError(res.error || 'Ocurrió un error inesperado.')
            }
        })
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-6 relative overflow-hidden font-sans">
            {/* Background Decorative Gradients */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-red-500/5 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10">
                {/* Brand / Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-xl shadow-amber-500/10 mb-4">
                        <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
                            {logoUrl ? (
                                <img src={logoUrl} alt={restaurantName} className="w-10 h-10 object-contain rounded-lg" />
                            ) : (
                                <span className="text-amber-400 text-2xl font-black italic tracking-tighter">11:11</span>
                            )}
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white/95">
                        INICIO DE SESIÓN
                    </h1>
                    <p className="text-neutral-500 text-sm mt-1">
                        Portal Administrativo • <span className="text-amber-500 font-medium">{restaurantName}</span>
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-2xl">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                        
                        {/* Error Banner */}
                        {error && (
                            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-200 text-sm p-4 rounded-xl animate-in fade-in slide-in-from-top-1 duration-200">
                                <ShieldAlert className="flex-shrink-0 text-red-500 mt-0.5" size={18} />
                                <span className="leading-tight">{error}</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-1.5">
                            <label className="text-neutral-400 text-xs font-bold uppercase tracking-wider pl-1">
                                Contraseña de acceso
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-amber-500 transition" size={18} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••••••"
                                    disabled={isPending}
                                    className="w-full bg-neutral-950/70 border border-neutral-800/80 p-4 pl-12 pr-12 rounded-xl focus:border-amber-500 focus:bg-neutral-950 focus:ring-1 focus:ring-amber-500 outline-none transition text-white placeholder-neutral-700"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            disabled={isPending}
                            type="submit"
                            className="w-full bg-white text-black font-extrabold py-4 px-6 rounded-xl hover:bg-neutral-200 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:bg-neutral-800 disabled:text-neutral-500 transition flex items-center justify-center gap-2 shadow-lg shadow-white/5 cursor-pointer"
                        >
                            {isPending ? (
                                <div className="w-5 h-5 border-2 border-neutral-600 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Acceder al Panel</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Bottom Utility Links */}
                    <div className="mt-8 pt-6 border-t border-white/5 text-center flex flex-col gap-2">
                        <Link href={`/${slug}`} className="text-xs text-neutral-500 hover:text-amber-500 transition-colors flex items-center justify-center gap-1.5 self-center">
                            ← Volver al menú público
                        </Link>
                    </div>
                </div>

                {/* Footer disclaimer */}
                <p className="text-center text-[10px] text-neutral-700 mt-6 tracking-wide uppercase">
                    Seguridad de plataforma provista por 11:11 Studio
                </p>
            </div>
        </div>
    )
}
