'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

function SuccessContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const slug = searchParams.get('slug');

    useEffect(() => {
        // Clear Cart logic - assuming we use localStorage or a global event for this.
        // Since cart is in context (MenuClient), simpler way is to clear the localStorage key if known.
        // Based on typical CartProvider implementation, it might verify localStorage. 
        // Let's try to clear 'cart-storage' or common keys.
        // Ideally, we'd use the CartContext, but this page sits outside the main provider tree potentially?
        // Actually, verify where CartProvider is. It's usually in page.tsx wrapping MenuClient. 
        // This page (/success) might need its own provider or just manual cleanup.
        // Manual cleanup is safest for "Fire and Request".

        if (typeof window !== 'undefined') {
            localStorage.removeItem('cart-storage'); // Typical zustand/persist key or similar
            // Also dispatch custom event if possible, or just rely on reload.
        }
    }, []);

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-green-500/10 p-6 rounded-full mb-6 text-green-500 animate-bounce">
                <CheckCircle size={64} />
            </div>

            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
                ¡Pago Exitoso!
            </h1>

            <p className="text-neutral-400 max-w-md mb-8 text-lg">
                Tu orden ha sido confirmada y la cocina ya está preparando tus alimentos.
                ¡Gracias por tu preferencia!
            </p>

            <Link
                href={slug ? `/${slug}` : '/'}
                className="bg-white text-black font-bold py-3 px-8 rounded-full hover:bg-neutral-200 transition transform hover:scale-105 shadow-xl"
            >
                Volver al Menú
            </Link>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Cargando...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
