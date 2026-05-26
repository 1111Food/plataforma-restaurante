'use client'

import { useState, useTransition } from 'react'
import { Terminal, ShieldAlert, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { loginSuperAdmin } from '../actions/auth'

export default function SuperAdminLoginForm() {
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!password) {
            setError('Ingresa la contraseña maestra para continuar.')
            return
        }

        startTransition(async () => {
            const res = await loginSuperAdmin(password)
            if (res.success) {
                window.location.reload()
            } else {
                setError(res.error || 'Acceso denegado.')
            }
        })
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-6 relative overflow-hidden font-sans">
            {/* Cyberpunk matrix gradient style background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 rounded-full blur-[140px] pointer-events-none"></div>
            <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 via-amber-500 to-amber-400 p-0.5 shadow-2xl shadow-red-500/10 mb-4">
                        <div className="w-full h-full bg-neutral-950 rounded-[14px] flex items-center justify-center">
                            <Terminal className="text-red-500" size={24} />
                        </div>
                    </div>
                    <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-400 to-amber-300">
                        11:11 GODMODE
                    </h1>
                    <p className="text-neutral-500 text-xs mt-1 uppercase tracking-widest">
                        Plataforma de Menús • Acceso de Super-Usuario
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-neutral-900/40 backdrop-blur-2xl border border-red-500/10 p-8 rounded-3xl shadow-2xl relative">
                    {/* Glowing outer frame lines */}
                    <div className="absolute -inset-px rounded-3xl bg-gradient-to-tr from-red-500/10 to-amber-500/10 pointer-events-none opacity-50"></div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-6 relative z-10">
                        {error && (
                            <div className="flex items-start gap-3 bg-red-950/40 border border-red-500/20 text-red-200 text-xs p-4 rounded-xl">
                                <ShieldAlert className="flex-shrink-0 text-red-500 mt-0.5" size={18} />
                                <span className="leading-tight">{error}</span>
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <label className="text-neutral-400 text-xs font-bold uppercase tracking-widest pl-1">
                                Contraseña Maestra de la Plataforma
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••••••"
                                    disabled={isPending}
                                    className="w-full bg-neutral-950/80 border border-neutral-800/80 p-4 pr-12 rounded-xl focus:border-red-500 focus:bg-neutral-950 focus:ring-1 focus:ring-red-500 outline-none transition text-white placeholder-neutral-700 font-mono text-lg tracking-wider"
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
                            className="w-full bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-black font-black py-4 px-6 rounded-xl active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 cursor-pointer"
                        >
                            {isPending ? (
                                <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Verificar Identidad</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-[10px] text-neutral-600 mt-8 tracking-wider uppercase">
                    Advertencia: Todo acceso es monitoreado y auditado.
                </p>
            </div>
        </div>
    )
}
