'use client';

import { useState, useEffect, useRef } from 'react';
import ModifierSelectorModal from './ui/ModifierSelectorModal';
import { useCart } from './CartProvider';
import Link from 'next/link';
import { ShoppingCart, Info, Calendar } from 'lucide-react';
import ClassicGrid from './templates/ClassicGrid';
import LuxuryShowcase from './templates/LuxuryShowcase';
import MinimalList from './templates/MinimalList';
import UrbanGrid from './templates/UrbanGrid';
import Lightbox from './ui/Lightbox';

// Tipos de datos
type MenuItem = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    image_url: string | null;
    detail_image_url?: string | null;
    third_image_url?: string | null; // New field
    is_available: boolean;
    is_featured?: boolean;
};

type Category = {
    name: string;
    menu_items: MenuItem[];
};

type Restaurant = {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
    logo_height?: number;
    logo_alignment?: 'left' | 'center' | 'right';
    promo_banner_url?: string | null;
    promo_banner_url_2?: string | null;
    promo_banner_url_3?: string | null;
    card_color?: string | null;
    template_style?: 'classic-grid' | 'luxury-showcase' | 'minimal-list' | 'urban-grid';
    background_color?: string;
    primary_color?: string;
    text_color?: string;
    font_color?: string;
    phone?: string | null;
    categories: Category[];
    restaurant_events?: any[];
};

export default function MenuClient({ restaurant: serverRestaurant }: { restaurant: any }) {
    const { addToCart, removeOne, items, cartTotal, setTableNumber } = useCart();
    const [restaurant, setRestaurant] = useState<Restaurant>(serverRestaurant);
    const [addedId, setAddedId] = useState<string | null>(null);

    // URL Param Logic for Table Detection
    useEffect(() => {
        // Simple client-side param reading
        const params = new URLSearchParams(window.location.search);
        const tableParam = params.get('table');
        if (tableParam) {
            setTableNumber(tableParam);
        }
    }, [setTableNumber]);

    // LIGHTBOX STATE
    const [lightboxItem, setLightboxItem] = useState<MenuItem | null>(null);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const openLightbox = (item: MenuItem) => {
        if (!item.image_url) return;
        setLightboxItem(item);
        setIsLightboxOpen(true);
    };

    const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
        if (!serverRestaurant?.categories) return [];
        return serverRestaurant.categories.flatMap((cat: any) =>
            (cat.menu_items || []).map((item: any) => ({
                ...item,
                category: cat.name,
                is_available: item.is_available !== false
            }))
        );
    });

    const [activeCategory, setActiveCategory] = useState<string>('');
    const categoryScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (restaurant) {
            document.documentElement.style.setProperty('--bg-color', restaurant.background_color || '#0D0D0D');
            document.documentElement.style.setProperty('--primary-color', restaurant.primary_color || '#FFB800');
            document.documentElement.style.setProperty('--text-color', restaurant.text_color || restaurant.font_color || '#F5F5F5');

            if (restaurant.categories?.[0]) {
                setActiveCategory(restaurant.categories[0].name);
            }
        }
    }, [restaurant]);

    const categories = Array.from(new Set(menuItems.map((item) => item.category)));

    // Scroll logic
    const scrollTo = (id: string, offset: number = 220) => {
        if (id === 'events') {
            const element = document.getElementById('events-section');
            if (element) {
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                setActiveCategory('events');
            }
            return;
        }

        setActiveCategory(id);
        const element = document.getElementById(id);
        if (element) {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
    };
    // Modifiers State
    const [customizingItem, setCustomizingItem] = useState<any | null>(null)
    const [isModifierModalOpen, setIsModifierModalOpen] = useState(false)

    // --- CART HANDLERS ---
    const handleAddToCart = (item: any) => {
        // CHECK IF HAS MODIFIERS
        // The query returns item_modifiers which contains the group definitions
        if (item.item_modifiers && item.item_modifiers.length > 0) {
            setCustomizingItem(item)
            setIsModifierModalOpen(true)
        } else {
            // DIRECT ADD
            addToCart({
                id: item.id, // Legacy ID (will be ignored by new addToCart logic which uses productId)
                productId: item.id,
                name: item.name,
                price: item.price,
                modifiers: []
            })
            // Show toast/flight animation (simplified for now with alert or just UI update)
            setAddedId(item.id);
            setTimeout(() => setAddedId(null), 1000);
        }
    }

    const handleConfirmCustomization = (item: any, selectedModifiers: any[], finalPrice: number) => {
        // Add to cart with modifiers
        addToCart({
            id: item.id, // Legacy
            productId: item.id,
            name: item.name,
            price: item.price, // Base price, total is calculated in cart usually or we overwrite price?
            // CartProvider calculates total as (price + modifiers) * qty.
            // So we pass BASE price of item, and modifiers list.
            modifiers: selectedModifiers
        })
        setCustomizingItem(null)
        setIsModifierModalOpen(false)
    }

    const renderTemplate = (catItems: MenuItem[]) => {
        const style = restaurant.template_style || 'classic-grid';

        // Props updated with Lightbox Handler
        const props = {
            items: catItems,
            restaurant,
            addToCart: handleAddToCart,
            removeOne,
            cartItems: items,
            addedId,
            onOpenLightbox: openLightbox // NEW PROP
        };

        switch (style) {
            case 'luxury-showcase':
                return <LuxuryShowcase {...props} />;
            case 'minimal-list':
                return <MinimalList {...props} />;
            case 'urban-grid':
                return <UrbanGrid {...props} />;
            case 'classic-grid':
            default:
                // ClassicGrid needs update to accept props (even if not fully used yet) or we ignore for now
                return <ClassicGrid {...props} />;
        }
    };

    if (!restaurant) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Cargando experiencia...</div>;

    const logoHeight = restaurant.logo_height || 80;
    const logoAlign = restaurant.logo_alignment || 'left';
    const hasEvents = restaurant.restaurant_events && restaurant.restaurant_events.length > 0;

    return (
        <div
            className="min-h-screen pb-20 transition-colors duration-500"
            style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
        >
            {/* --- HEADER --- */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-opacity-95 backdrop-blur-md border-b border-white/5 shadow-xl transition-all duration-300"
                style={{ backgroundColor: 'var(--bg-color)' }}>

                <div className={`max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center ${logoAlign === 'center' ? 'justify-center relative' :
                    logoAlign === 'right' ? 'justify-end' : 'justify-between'
                    }`}>
                    <div className="flex-1 flex items-center" style={{
                        justifyContent: logoAlign === 'center' ? 'center' :
                            logoAlign === 'right' ? 'flex-end' : 'flex-start'
                    }}>
                        {restaurant.logo_url ? (
                            <div
                                className="relative transition-all duration-300 transform hover:scale-105"
                                style={{ height: `${logoHeight}px`, width: 'auto', minWidth: '100px' }}
                            >
                                <img
                                    src={restaurant.logo_url}
                                    alt={restaurant.name}
                                    className="w-full h-full object-contain"
                                    style={{ objectPosition: logoAlign }}
                                />
                            </div>
                        ) : (
                            <h1 className="text-xl font-bold tracking-tight uppercase" style={{ color: 'var(--primary-color)' }}>
                                {restaurant.name}
                            </h1>
                        )}
                    </div>

                    {(logoAlign === 'center' || logoAlign === 'right') && (
                        <button className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
                            <Info className="w-6 h-6" style={{ color: 'var(--primary-color)' }} />
                        </button>
                    )}
                    {logoAlign === 'left' && (
                        <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
                            <Info className="w-6 h-6" style={{ color: 'var(--primary-color)' }} />
                        </button>
                    )}
                </div>

                <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-4 overflow-x-auto no-scrollbar">
                    <div className="flex space-x-3" ref={categoryScrollRef}>
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => scrollTo(cat)}
                                className={`
                  px-5 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all duration-300 transform components
                  ${activeCategory === cat ? 'scale-105 shadow-lg' : 'hover:bg-white/5 opacity-70'}
                `}
                                style={{
                                    backgroundColor: activeCategory === cat ? 'var(--primary-color)' : 'transparent',
                                    color: activeCategory === cat ? '#000' : 'var(--text-color)',
                                    border: activeCategory === cat ? 'none' : '1px solid rgba(255,255,255,0.2)'
                                }}
                            >
                                {cat}
                            </button>
                        ))}

                        {hasEvents && (
                            <button
                                onClick={() => scrollTo('events')}
                                className="px-5 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all duration-300 flex items-center gap-2 border border-white/10 hover:bg-white/10"
                                style={{ color: 'var(--primary-color)' }}
                            >
                                <Calendar size={14} /> EVENTOS
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-52 md:pt-60 space-y-12 animate-fade-in">

                {/* CAROUSEL / BANNERS */}
                {(() => {
                    const banners = [
                        restaurant.promo_banner_url,
                        restaurant.promo_banner_url_2,
                        restaurant.promo_banner_url_3
                    ].filter(Boolean) as string[];

                    if (banners.length === 0) return null;

                    if (banners.length === 1) {
                        return (
                            <div className="w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 relative group transform hover:scale-[1.01] transition-transform duration-500">
                                <img
                                    src={banners[0]}
                                    className="w-full h-auto object-cover max-h-64"
                                    alt="Promoción Especial"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-4 left-4">
                                    <span className="bg-[var(--primary-color)] text-black text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Destacado</span>
                                </div>
                            </div>
                        )
                    }

                    // Carousel Logic for multiple banners
                    return <BannerCarousel banners={banners} primaryColor={restaurant.primary_color || '#FFB800'} />
                })()}

                {categories.map((cat) => (
                    <section key={cat} id={cat} className="scroll-mt-56">
                        <div className="flex items-center gap-4 mb-6">
                            <h2 className="text-2xl font-bold tracking-wide capitalize">{cat}</h2>
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--primary-color)] to-transparent opacity-50"></div>
                        </div>

                        {renderTemplate(menuItems.filter((item) => item.category === cat))}
                    </section>
                ))}

                {hasEvents && (
                    <section id="events-section" className="pt-12 border-t border-white/5 scroll-mt-48">
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <span className="w-12 h-[1px] bg-[var(--primary-color)]"></span>
                            <h2 className="text-2xl font-bold uppercase tracking-widest text-center">Eventos Próximos</h2>
                            <span className="w-12 h-[1px] bg-[var(--primary-color)]"></span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {restaurant.restaurant_events!.map((event: any) => (
                                <div key={event.id} className="relative aspect-video rounded-2xl overflow-hidden group shadow-2xl border border-white/10">
                                    {event.image_url && <img src={event.image_url} className="absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-110" />}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-6">
                                        <span className="bg-[var(--primary-color)] text-black text-[10px] font-bold px-2 py-1 rounded w-fit mb-2 uppercase">{event.event_type}</span>
                                        <h3 className="text-2xl font-bold text-white mb-1">{event.title}</h3>
                                        <p className="text-sm text-gray-200 line-clamp-2">{event.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </main>

            {items.length > 0 && (
                <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-50 pointer-events-none">
                    <Link
                        href={`/${restaurant.slug}/checkout`}
                        className="pointer-events-auto shadow-[0_0_20px_rgba(0,0,0,0.5)] px-8 py-4 rounded-full font-bold flex items-center gap-4 transform transition hover:scale-105 active:scale-95 animate-bounce-in"
                        style={{ backgroundColor: 'var(--text-color)', color: 'var(--bg-color)' }}
                    >
                        <div className="relative">
                            <ShoppingCart size={24} />
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                                {items.reduce((acc, i) => acc + i.quantity, 0)}
                            </span>
                        </div>
                        <span className="text-lg">Ver Pedido • Q{cartTotal.toFixed(2)}</span>
                    </Link>
                </div>
            )}

            {/* IMMERSIVE LIGHTBOX */}
            <Lightbox
                isOpen={isLightboxOpen && !!lightboxItem}
                onClose={() => setIsLightboxOpen(false)}
                images={[
                    lightboxItem?.image_url,
                    lightboxItem?.detail_image_url,
                    lightboxItem?.third_image_url
                ].filter(Boolean) as string[]}
            />

            {/* MODIFIER SELECTOR MODAL */}
            {customizingItem && (
                <ModifierSelectorModal
                    isOpen={isModifierModalOpen}
                    onClose={() => {
                        setIsModifierModalOpen(false)
                        setCustomizingItem(null)
                    }}
                    item={customizingItem}
                    onAddToOrder={handleConfirmCustomization}
                />
            )}
        </div>
    );
}

function BannerCarousel({ banners, primaryColor }: { banners: string[], primaryColor: string }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000); // 5 seconds
        return () => clearInterval(interval);
    }, [banners.length]);

    return (
        <div className="w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 relative group bg-[#0D0D0D]">
            <div
                className="relative w-full h-48 md:h-64 transition-all duration-500 ease-in-out"
            >
                {banners.map((banner, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            }`}
                    >
                        <img
                            src={banner}
                            className="w-full h-full object-cover"
                            alt={`Promo ${index + 1}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    </div>
                ))}
            </div>

            {/* Indicators */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {banners.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-all ${index === currentIndex
                            ? 'w-6 bg-[var(--primary-color)]'
                            : 'bg-white/50 hover:bg-white'
                            }`}
                        style={{ backgroundColor: index === currentIndex ? primaryColor : undefined }}
                    />
                ))}
            </div>

            <div className="absolute bottom-4 left-4 z-20">
                <span className="bg-[var(--primary-color)] text-black text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider" style={{ backgroundColor: primaryColor }}>Destacado</span>
            </div>
        </div>
    )
}
