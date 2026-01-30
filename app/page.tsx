import Link from 'next/link';
import { Play, Palette, Settings, Calendar, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white font-sans selection:bg-[#FFB800]/30">
      {/* Navbar Minimalista */}
      <nav className="fixed top-0 w-full z-50 bg-[#0D0D0D]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-[0.2em] hover:text-[#FFB800] transition-colors">
            11:11 STUDIO
          </Link>
          <Link href="/demo-luxury" className="text-xs font-bold text-[#FFB800] hover:text-white transition-colors uppercase tracking-widest border border-[#FFB800]/30 px-4 py-2 rounded-full hover:bg-[#FFB800] hover:text-black">
            Ver Demo
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 text-center max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
        <div className="inline-block px-3 py-1 mb-6 rounded-full border border-[#FFB800]/30 bg-[#FFB800]/10 animate-fade-in-up">
          <span className="text-[#FFB800] text-[10px] font-bold uppercase tracking-[0.2em]">Plataforma para Restaurantes</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold leading-tight mb-8 bg-gradient-to-br from-white to-neutral-500 bg-clip-text text-transparent animate-fade-in-up delay-100">
          La Evolución Digital <br /> de tu Restaurante
        </h1>
        <p className="text-neutral-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
          Menús vivos, gestión de eventos y diseño de lujo. Todo en una plataforma diseñada para vender más.
        </p>
        <Link
          href="/demo-luxury"
          className="group inline-flex items-center gap-3 bg-[#FFB800] text-black px-8 py-4 rounded-full font-bold text-sm tracking-widest uppercase hover:bg-white transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,184,0,0.3)] animate-fade-in-up delay-300"
        >
          Ver Demo en Vivo
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Style Selector */}
        <div className="mt-12 animate-fade-in-up delay-400">
          <p className="text-neutral-500 text-xs uppercase tracking-widest mb-4">¿Prefieres otro estilo? Mira estas variaciones:</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/demo-luxury" className="px-4 py-2 rounded-full border border-[#FFB800]/50 text-[#FFB800] text-xs font-bold uppercase hover:bg-[#FFB800] hover:text-black transition-colors">
              Estilo Luxury
            </Link>
            <Link href="/demo-fresh" className="px-4 py-2 rounded-full border border-white/20 text-neutral-400 text-xs font-bold uppercase hover:bg-white hover:text-black transition-colors">
              Estilo Fresh
            </Link>
            <Link href="/demo-street" className="px-4 py-2 rounded-full border border-white/20 text-neutral-400 text-xs font-bold uppercase hover:bg-white hover:text-black transition-colors">
              Estilo Urbano
            </Link>
          </div>
        </div>

        {/* Hero Visual/Glow */}
        <div className="mt-16 relative w-full h-1">
          <div className="absolute left-1/2 -translate-x-1/2 -top-10 bg-gradient-to-t from-[#FFB800]/20 to-transparent blur-3xl opacity-30 rounded-full w-3/4 h-32 pointer-events-none"></div>
        </div>
      </section>

      {/* Grid de Poder */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-8 rounded-3xl bg-[#1a1a1a]/40 backdrop-blur-sm border border-white/5 hover:border-[#FFB800]/50 transition-colors group">
            <div className="w-12 h-12 bg-[#222] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#FFB800] transition-colors">
              <Play size={24} className="text-white group-hover:text-black" />
            </div>
            <h3 className="text-xl font-bold mb-3">Menú Vivo</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Soporte para GIFs y Videos. La comida entra por los ojos. Olvídate de los menús estáticos y aburridos.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 rounded-3xl bg-[#1a1a1a]/40 backdrop-blur-sm border border-white/5 hover:border-[#FFB800]/50 transition-colors group">
            <div className="w-12 h-12 bg-[#222] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#FFB800] transition-colors">
              <Palette size={24} className="text-white group-hover:text-black" />
            </div>
            <h3 className="text-xl font-bold mb-3">Branding Total</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Tu logo, tus colores. Se adapta a tu marca automáticamente con nuestro motor de personalización.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 rounded-3xl bg-[#1a1a1a]/40 backdrop-blur-sm border border-white/5 hover:border-[#FFB800]/50 transition-colors group">
            <div className="w-12 h-12 bg-[#222] rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#FFB800] transition-colors">
              <Settings size={24} className="text-white group-hover:text-black" />
            </div>
            <h3 className="text-xl font-bold mb-3">Gestión Real</h3>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Panel administrativo para ocultar platillos agotados al instante y actualizar precios en segundos.
            </p>
          </div>
        </div>
      </section>

      {/* Sección Eventos */}
      <section className="py-32 bg-gradient-to-b from-transparent to-[#050505]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-[#FFB800] text-xs font-bold uppercase tracking-[0.3em] mb-4 block">Social Events</span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">Vende Experiencias</h2>
          <p className="text-neutral-400 max-w-xl mx-auto mb-10 text-lg">
            No solo vendas comida, vende momentos. Permite a tus clientes reservar eventos exclusivos, catas de vino y cenas privadas directamente desde el menú.
          </p>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#1a1a1a] border border-white/10 text-[#FFB800] shadow-[0_0_30px_-10px_rgba(255,184,0,0.3)]">
            <Calendar size={32} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center bg-black">
        <p className="text-neutral-600 text-[10px] uppercase tracking-widest font-bold">
          11:11 Studio © 2026. Guatemala.
        </p>
      </footer>
    </div>
  );
}
