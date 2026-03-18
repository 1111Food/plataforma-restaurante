'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Search, X, ChevronRight, UtensilsCrossed, Info, Calendar, Image as ImageIcon } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import Link from 'next/link';

// Use Unified Components
import UnifiedProductCard from './UnifiedProductCard';
import { useMenuLogic } from '../hooks/useMenuLogic';
import Lightbox from './ui/Lightbox';
import ModifierSelectorModal from './ui/ModifierSelectorModal';
import { useCart } from './CartProvider';

type MenuItem = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    image_url: string | null;
    detail_image_url?: string | null;
    third_image_url?: string | null;
    is_available: boolean;
    is_featured?: boolean;
    item_modifiers?: any[];
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
    template_style?: 'classic-grid' | 'luxury-showcase' | 'minimal-list' | 'urban-grid' | 'premium-luxe' | 'editorial-chalkboard' | 'urban-burger';
    background_color?: string;
    primary_color?: string;
    text_color?: string;
    font_color?: string;
    phone?: string | null;
    categories: Category[];
    restaurant_events?: any[];
    theme_config?: {
        templateId?: string;
        primaryColor?: string;
        imageSize?: 'small' | 'medium' | 'large';
        [key: string]: any;
    };
    schedule_config?: {
        active: boolean;
        slots: {
            id: string;
            label: string;
            isActive?: boolean;
            start: string;
            end: string;
            templateId: string;
            categoryMatch: string;
        }[];
    };
    restaurant_gallery?: {
        active: boolean;
        albums: {
            id: string;
            name: string;
            media: string[];
            video?: string | null;
        }[];
    };
    [key: string]: any;
};

interface MenuClientProps {
    restaurant: Restaurant;
    initialItems?: any[]; // Legacy prop
    categories?: string[]; // Legacy prop
}

// ... interface ...

function BannerCarousel({ banners, primaryColor, onOpenLightbox }: { banners: string[], primaryColor: string, onOpenLightbox: () => void }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const resetTimeout = () => {
        if (timeoutRef.current) clearInterval(timeoutRef.current);
    }

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);

        return () => resetTimeout();
    }, [banners.length, currentIndex]);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    }

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    }

    // Touch Handlers
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
        resetTimeout();
    }

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    }

    const onTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart || !touchEnd) {
            if (touchStart && !touchEnd) {
                onOpenLightbox();
            }
            return;
        }

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            nextSlide();
        } else if (isRightSwipe) {
            prevSlide();
        } else {
            if (Math.abs(distance) < 10) {
                onOpenLightbox();
            }
        }
    }

    return (
        <div
            className="w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 relative group bg-[#0D0D0D] cursor-pointer touch-pan-y"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onClick={onOpenLightbox}
        >
            <div className="relative w-full h-48 md:h-64 transition-all duration-500 ease-in-out">
                {banners.map((banner, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
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
                        onClick={(e) => {
                            e.stopPropagation();
                            setCurrentIndex(index);
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? 'w-6' : 'bg-white/50 hover:bg-white'}`}
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

export default function MenuClient({ restaurant: serverRestaurant }: MenuClientProps) {
    const { addToCart, removeOne, items, cartTotal, setTableNumber } = useCart();
    const [restaurant] = useState<Restaurant>(serverRestaurant);

    // Dynamic Template State
    const [activeTemplate, setActiveTemplate] = useState<string>(restaurant.template_style || 'classic-grid');

    // ... existing useState ...
    const [addedId, setAddedId] = useState<string | null>(null);

    // ... URL Param ...

    // SCHEDULE LOGIC
    useEffect(() => {
        if (!restaurant.schedule_config?.active) return;

        const checkSchedule = () => {
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            const activeSlot = restaurant.schedule_config?.slots.find(slot => {
                // Check Active Status (Default to true if undefined)
                if (slot.isActive === false) return false;

                const [startH, startM] = slot.start.split(':').map(Number);
                const [endH, endM] = slot.end.split(':').map(Number);
                const startTotal = startH * 60 + startM;
                const endTotal = endH * 60 + endM;

                if (endTotal < startTotal) {
                    // Span midnight (e.g. 18:00 to 06:00)
                    return currentMinutes >= startTotal || currentMinutes <= endTotal;
                }
                return currentMinutes >= startTotal && currentMinutes <= endTotal;
            });

            if (activeSlot) {
                // 1. Update Template
                if (activeSlot.templateId && activeSlot.templateId !== activeTemplate) {
                    setActiveTemplate(activeSlot.templateId);
                    toast.success(`Modo ${activeSlot.label} activado`, { duration: 3000, icon: '🕒' });
                }

                // 2. Auto-Select Category (only on initial load or change?)
                // Doing it every minute might be annoying if user scrolled away.
                // Let's keep it simple: If we just switched template or it's mount? 
                // The prompt says "Al cargar el menú...". 
                // But if time changes while browsing? 
                // "Flexibilidad: El usuario siempre debe poder navegar... pero la Home debe ser la que dicte".
                // So maybe only scroll if we are strictly "at home" or just do it once?
                // For now, let's leave the scroll logic as is but maybe prevent spamming toasts.

                if (activeSlot.categoryMatch) {
                    const matchedCat = restaurant.categories.find(c =>
                        c.name.toLowerCase().includes(activeSlot.categoryMatch.toLowerCase())
                    );
                    // Only scroll if we are not already there? 
                    // Actually, let's rely on the user's manual navigation.
                    // If we want to enforce it, we should check if we just mounted.
                    // But 'checkSchedule' runs on mount.
                    if (matchedCat) {
                        // We can't easily detect "mount" inside this closure without ref.
                        // But we can check if activeTemplate changed.
                    }
                }
                if (activeSlot.categoryMatch) {
                    const matchedCat = restaurant.categories.find(c =>
                        c.name.toLowerCase().includes(activeSlot.categoryMatch.toLowerCase())
                    );
                    if (matchedCat && activeTemplate !== activeSlot.templateId) {
                        scrollTo(matchedCat.name);
                    }
                }

            } else {
                // FALLBACK: No active slot matches -> Revert to Default
                if (activeTemplate !== restaurant.template_style) {
                    setActiveTemplate(restaurant.template_style || 'classic-grid');
                    // toast.info("Modo Estándar activado", { duration: 2000 });
                }
            }
        };

        // Run on mount
        checkSchedule();

        // Optional: Run every minute?
        const interval = setInterval(checkSchedule, 60000);
        return () => clearInterval(interval);
    }, [restaurant]);


    // URL Param Logic
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tableParam = params.get('table');
        if (tableParam) setTableNumber(tableParam);
    }, [setTableNumber]);

    // LIGHTBOX STATE
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);

    const openItemLightbox = (item: MenuItem) => {
        if (!item.image_url) return;
        setLightboxImages([
            item.image_url,
            item.detail_image_url,
            item.third_image_url
        ].filter(Boolean) as string[]);
        setActiveGalleryIndex(0);
        setIsLightboxOpen(true);
    };

    const openBannerLightbox = (allBanners: string[]) => {
        setLightboxImages(allBanners);
        setActiveGalleryIndex(0);
        setIsLightboxOpen(true);
    }

    const openGalleryLightbox = (images: string[], index: number) => {
        setLightboxImages(images);
        setActiveGalleryIndex(index);
        setIsLightboxOpen(true);
    };

    // MENU ITEMS
    const [menuItems] = useState<MenuItem[]>(() => {
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
    const [viewMode, setViewMode] = useState<'menu' | 'gallery'>('menu');
    const categoryScrollRef = useRef<HTMLDivElement>(null);

    // CSS VARIABLES
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

    const categoriesList = Array.from(new Set(menuItems.map((item) => item.category)));
    if (restaurant.restaurant_gallery?.active) {
        categoriesList.push('Galería');
    }

    // SCROLL
    const scrollTo = (id: string, offset: number = 220) => {
        if (id === 'Galería') {
            setViewMode('gallery');
            setActiveCategory('Galería');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (viewMode === 'gallery') {
            setViewMode('menu');
            // Allow render cycle to switch back to menu before scrolling
            setTimeout(() => {
                setActiveCategory(id);
                const element = document.getElementById(id);
                if (element) {
                    const elementPosition = element.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - (window.innerWidth < 768 ? 140 : 180);
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
            }, 50);
            return;
        }

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

    // MODIFIERS
    const [customizingItem, setCustomizingItem] = useState<any | null>(null)
    const [isModifierModalOpen, setIsModifierModalOpen] = useState(false)

    const handleAddToCart = (item: any) => {
        if (item.item_modifiers && item.item_modifiers.length > 0) {
            setCustomizingItem(item)
            setIsModifierModalOpen(true)
        } else {
            addToCart({
                id: item.id,
                productId: item.id,
                name: item.name,
                price: item.price,
                modifiers: []
            })
            setAddedId(item.id);
            setTimeout(() => setAddedId(null), 1000);
        }
    }

    const handleConfirmCustomization = (item: any, selectedModifiers: any[], finalPrice: number) => {
        addToCart({
            id: item.id,
            productId: item.id,
            name: item.name,
            price: item.price,
            modifiers: selectedModifiers
        })
        setCustomizingItem(null)
        setIsModifierModalOpen(false)
    }

    // --- RENDER DYNAMIC TEMPLATE ---
    const renderTemplate = (catItems: MenuItem[]) => {
        const style = activeTemplate; // Use dynamic state instead of prop

        // 1. Determine Variant & Grid
        let variant: 'classic' | 'luxe' | 'editorial' | 'overlap' | 'compact' | 'list' = 'classic';
        let gridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'; // Default

        // Check Theme Config for Mobile Layout Override
        const mobileLayout = restaurant.theme_config?.mobileLayout || 'card-premium'; // default

        // Desktop / Template Logic
        if (style === 'urban-burger') {
            variant = 'overlap';
            gridClass = 'grid grid-cols-1 gap-12 md:gap-16';
        }
        else if (style === 'premium-luxe' || style === 'luxury-showcase') {
            variant = 'luxe';
            gridClass = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6';
        }
        else if (style === 'editorial-chalkboard') {
            variant = 'editorial';
            gridClass = 'flex flex-col gap-0';
        }
        else if (style === 'minimal-list') {
            gridClass = 'flex flex-col gap-2 max-w-3xl mx-auto';
            // Maybe force 'list' variant?
        }

        // MOBILE OVERRIDES (Responsive Check? We render on server/client matching. 
        // We can use CSS classes for responsive grid, but variant prop is passed to card.
        // UnifiedProductCard handles its own internal responsive style usually.
        // But 'compact' variant is distinct structure.

        // If 'grid-compact' is active manually via config:
        if (restaurant.theme_config?.layoutMode === 'grid-compact') {
            variant = 'compact';
            gridClass = 'grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4';
        }
        else if (restaurant.theme_config?.layoutMode === 'list-minimal') {
            variant = 'list';
            gridClass = 'flex flex-col gap-3 max-w-2xl mx-auto';
        }


        // 3. Resolve Theme Config
        const themeConfig = restaurant.theme_config || {
            primaryColor: restaurant.primary_color || '#FFB800',
            imageSize: 'medium',
            templateId: style
        };
        // Sync primary color
        if (!themeConfig.primaryColor) themeConfig.primaryColor = restaurant.primary_color || '#FFB800';

        return (
            <div className={gridClass}>
                {catItems.map(item => (
                    <UnifiedProductCard
                        key={item.id}
                        item={item}
                        variant={variant}
                        themeConfig={themeConfig}
                        qty={items.filter((i: any) => i.productId === item.id || i.id === item.id).reduce((acc: number, val: any) => acc + val.quantity, 0)}
                        onAdd={() => handleAddToCart(item)}
                        onRemove={() => {
                            const match = items.findLast((i: any) => i.productId === item.id || i.id === item.id);
                            if (match) removeOne(match.id);
                        }}
                        onOpenLightbox={openItemLightbox}
                    />
                ))}
            </div>
        );
    };

    if (!restaurant) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Cargando experiencia...</div>;

    const logoHeight = restaurant.logo_height || 80;
    const logoAlign = restaurant.logo_alignment || 'left';
    const hasEvents = restaurant.restaurant_events && restaurant.restaurant_events.length > 0;
    const availableBanners = [
        restaurant.promo_banner_url,
        restaurant.promo_banner_url_2,
        restaurant.promo_banner_url_3
    ].filter(Boolean) as string[];

    return (
        <div
            className="min-h-screen pb-20 transition-colors duration-500"
            style={{ backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
        >
            <header className="fixed top-0 left-0 right-0 z-[100] bg-opacity-95 backdrop-blur-md border-b border-white/5 shadow-xl transition-all duration-300"
                style={{ backgroundColor: 'var(--bg-color)' }}>
                <div className={`max-w-7xl mx-auto px-4 lg:px-8 py-1 flex items-center ${logoAlign === 'center' ? 'justify-center relative' : logoAlign === 'right' ? 'justify-end' : 'justify-between'}`}>
                    <div className="flex-1 flex items-center" style={{ justifyContent: logoAlign === 'center' ? 'center' : logoAlign === 'right' ? 'flex-end' : 'flex-start' }}>
                        {restaurant.logo_url ? (
                            <div className="relative transition-all duration-300 transform hover:scale-105 h-14 md:h-auto" style={{ width: 'auto', minWidth: '60px', height: undefined }}>
                                <img
                                    src={restaurant.logo_url}
                                    alt={restaurant.name}
                                    className="w-full h-full object-contain md:h-[var(--logo-height)]"
                                    style={{
                                        objectPosition: logoAlign,
                                        ['--logo-height' as any]: `${logoHeight}px`
                                    }}
                                />
                            </div>
                        ) : (
                            <h1 className="text-xl font-bold tracking-tight uppercase" style={{ color: 'var(--primary-color)' }}>{restaurant.name}</h1>
                        )}
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-2 pr-8 overflow-x-auto no-scrollbar relative z-50">
                    <div className="flex space-x-3" ref={categoryScrollRef}>
                        {categoriesList.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => scrollTo(cat)}
                                className={`px-6 py-2 rounded-full whitespace-nowrap min-w-max text-sm font-semibold transition-all duration-300 transform ${activeCategory === cat ? 'scale-105 shadow-lg' : 'hover:bg-white/5 opacity-70'}`}
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
                            <button onClick={() => scrollTo('events')} className="px-6 py-2 rounded-full whitespace-nowrap min-w-max text-sm font-bold transition-all duration-300 flex items-center gap-2 border border-white/10 hover:bg-white/10" style={{ color: 'var(--primary-color)' }}>
                                <Calendar size={14} /> EVENTOS
                            </button>
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 lg:px-8 pt-24 md:pt-48 space-y-8 animate-fade-in">
                {viewMode === 'menu' ? (
                    <>
                        {/* BANNERS - Full Width Mobile */}
                        <div className="w-[calc(100%+2rem)] -mx-4 md:w-full md:mx-0 aspect-video md:aspect-[3/1] md:max-h-[500px] overflow-hidden md:rounded-2xl shadow-xl mb-6">
                            {(() => {
                                const banners = availableBanners;
                                if (banners.length === 0) return null;
                                if (banners.length === 1) {
                                    return (
                                        <div className="w-full h-full relative group cursor-pointer" onClick={() => openBannerLightbox(banners)}>
                                            <img src={banners[0]} className="w-full h-full object-cover" alt="Promoción Especial" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        </div>
                                    )
                                }
                                return <BannerCarousel banners={banners} primaryColor={restaurant.primary_color || '#FFB800'} onOpenLightbox={() => openBannerLightbox(banners)} />
                            })()}
                        </div>

                        {/* MENU SECTIONS */}
                        {categoriesList.filter(c => c !== 'Galería').map((cat) => (
                            <section key={cat} id={cat} className="scroll-mt-40">
                                <div className="flex items-center gap-4 mb-6">
                                    <h2 className="text-2xl font-bold tracking-wide capitalize">{cat}</h2>
                                    <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--primary-color)] to-transparent opacity-50"></div>
                                </div>
                                {renderTemplate(menuItems.filter((item) => item.category === cat))}
                            </section>
                        ))}

                        {/* EVENTS */}
                        {hasEvents && (
                            <section id="events-section" className="pt-12 border-t border-white/5 scroll-mt-48">
                                <div className="flex items-center justify-center gap-4 mb-8">
                                    <h2 className="text-2xl font-bold uppercase tracking-widest text-center">Eventos Próximos</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {restaurant.restaurant_events!.map((event: any) => (
                                        <div key={event.id} className="relative aspect-video rounded-2xl overflow-hidden group shadow-2xl border border-white/10">
                                            {event.image_url && <img src={event.image_url} className="absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-700 group-hover:scale-110" />}
                                            <h3 className="text-2xl font-bold text-white mb-1 relative z-10 p-6">{event.title}</h3>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                ) : (
                    /* GALLERY VIEW MODE */
                    <section id="gallery-section" className="pt-4 min-h-[50vh] animate-fade-in">
                        <div className="flex items-center gap-4 mb-6">
                            <h2 className="text-2xl font-bold uppercase tracking-widest flex items-center gap-3">
                                <ImageIcon size={24} className="text-[var(--primary-color)]" /> Galería de Experiencia
                            </h2>
                            <div className="h-[1px] flex-1 bg-gradient-to-r from-[var(--primary-color)] to-transparent opacity-50"></div>
                        </div>

                        <div className="space-y-12">
                            {(restaurant.restaurant_gallery?.albums || []).map((album) => (
                                <div key={album.id}>
                                    <h3 className="text-sm font-bold text-[#888] uppercase tracking-[0.2em] mb-4 pl-1 border-l-2 border-[var(--primary-color)]">{album.name}</h3>
                                    <div className="grid grid-cols-3 md:grid-cols-5 gap-1">
                                        {/* Video Feature (First Slot) */}
                                        {album.video && (
                                            <div className="col-span-2 row-span-2 relative group aspect-square bg-black overflow-hidden cursor-pointer">
                                                <video
                                                    src={album.video}
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                    controls
                                                    muted
                                                    loop
                                                    playsInline
                                                />
                                            </div>
                                        )}

                                        {/* Photos */}
                                        {(album.media || []).map((url: string, idx: number) => (
                                            <div
                                                key={idx}
                                                className="relative aspect-square overflow-hidden cursor-pointer group bg-[#111]"
                                                onClick={() => openGalleryLightbox(album.media, idx)}
                                            >
                                                <img
                                                    src={url}
                                                    alt={`Photo ${idx}`}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 filter brightness-90 group-hover:brightness-110"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {items.length > 0 && (
                <div className="fixed bottom-6 left-0 right-0 px-4 flex justify-center z-50 pointer-events-none">
                    <Link href={`/${restaurant.slug}/checkout`} className="pointer-events-auto shadow-[0_0_20px_rgba(0,0,0,0.5)] px-8 py-4 rounded-full font-bold flex items-center gap-4 transform transition hover:scale-105 active:scale-95 animate-bounce-in" style={{ backgroundColor: 'var(--text-color)', color: 'var(--bg-color)' }}>
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

            <Lightbox
                isOpen={isLightboxOpen && lightboxImages.length > 0}
                onClose={() => setIsLightboxOpen(false)}
                images={lightboxImages}
                initialIndex={activeGalleryIndex}
            />

            {customizingItem && (
                <ModifierSelectorModal
                    isOpen={isModifierModalOpen}
                    onClose={() => { setIsModifierModalOpen(false); setCustomizingItem(null); }}
                    item={customizingItem}
                    onAddToOrder={handleConfirmCustomization}
                />
            )}
        </div>
    );
}
