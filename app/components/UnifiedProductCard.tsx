import { Check, Plus, Maximize2, SlidersHorizontal, Minus } from 'lucide-react';
import QuantityControl from './QuantityControl';

type MenuItem = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    image_url: string | null;
    is_available: boolean;
    item_modifiers?: any[];
    [key: string]: any;
};

interface UnifiedCardProps {
    item: MenuItem;
    variant: 'classic' | 'luxe' | 'editorial' | 'overlap' | 'compact' | 'list';
    themeConfig: {
        primaryColor: string;
        imageSize?: 'small' | 'medium' | 'large';
        cardColor?: string | null;
        [key: string]: any;
    };
    qty: number;
    onAdd: () => void;
    onRemove: () => void;
    onOpenLightbox?: (item: MenuItem) => void;
}

export default function UnifiedProductCard({
    item,
    variant,
    themeConfig,
    qty,
    onAdd,
    onRemove,
    onOpenLightbox
}: UnifiedCardProps) {
    const { primaryColor, cardColor, imageSize = 'medium' } = themeConfig;
    const hasModifiers = item.item_modifiers && item.item_modifiers.length > 0;

    // Helper to determine Image Aspect Ratio based on Config + Variant
    const getImageClass = () => {
        if (variant === 'overlap') return 'aspect-square object-contain -ml-[15%] w-[120%]';
        if (variant === 'luxe') return 'absolute inset-0 w-full h-full object-cover';

        // Dynamic Size for Classic/Editorial
        // Dynamic Size for Classic/Editorial
        const sizeMap = {
            small: 'w-20 h-20 object-cover flex-shrink-0 rounded-lg',
            medium: 'w-32 h-32 object-cover flex-shrink-0 rounded-lg',
            large: 'w-full aspect-square object-cover rounded-xl'
        };
        // @ts-ignore
        return sizeMap[imageSize] || sizeMap.large;
    };

    // --- VARIANT: OVERLAP (Urban Burger style) ---
    if (variant === 'overlap') {
        // Dynamic Overlap Size
        const overlapSizeClass = {
            small: 'w-[100%] -ml-[0%]', // Less overlap
            medium: 'w-[125%] -ml-[25%]', // Standard urban overlap
            large: 'w-[140%] -ml-[40%]' // Massive pop-out
        }[imageSize] || 'w-[125%] -ml-[25%]';

        return (
            <div className="relative flex items-center justify-between min-h-[160px] md:min-h-[180px] py-4 md:py-6 overflow-visible pr-2">
                {/* Left Text */}
                <div className="w-[60%] md:w-[55%] flex flex-col justify-center gap-2 md:gap-3 z-10 relative">
                    <div className="flex items-start gap-2">
                        <Check className="stroke-[4] mt-1 shrink-0" size={16} style={{ color: primaryColor }} />
                        <div>
                            <h3 className="text-xl md:text-3xl font-black uppercase leading-[0.95] tracking-tighter transform -skew-x-2 md:-skew-x-3 text-white drop-shadow-md break-words hyphens-auto">
                                {item.name}
                            </h3>
                            <div className="w-12 md:w-16 h-1 md:h-1.5 bg-[var(--primary-color)] mt-1.5 md:mt-2 mb-1 md:mb-2"></div>
                        </div>
                    </div>
                    {item.description && (
                        <p className="text-[10px] md:text-sm font-bold text-gray-400 uppercase tracking-tight line-clamp-2 md:line-clamp-3 pl-6 md:pl-7 leading-tight">
                            {item.description}
                        </p>
                    )}
                    <div className="pl-6 md:pl-7 mt-2 md:mt-3">
                        {qty > 0 ? (
                            <QuantityControl quantity={qty} onAdd={onAdd} onRemove={onRemove} color={primaryColor} style="minimal" />
                        ) : (
                            <button
                                onClick={onAdd}
                                className="text-black px-4 md:px-5 py-2 md:py-2.5 font-black uppercase text-[10px] md:text-xs tracking-[0.2em] hover:brightness-110 shadow-[3px_3px_0px_rgba(0,0,0,0.2)] md:shadow-[4px_4px_0px_rgba(0,0,0,0.2)] transform active:translate-y-1 active:shadow-none transition-all"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {hasModifiers ? 'CUSTOMIZE' : 'ORDER NOW'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Right Image (Popping Out) - Overflow Visible Container */}
                <div
                    className="w-[40%] md:w-[45%] relative flex justify-center items-center pointer-events-auto cursor-pointer h-full"
                    onClick={() => onOpenLightbox && onOpenLightbox(item)}
                    style={{ zIndex: 50 }}
                >
                    <div
                        className={`relative aspect-square ${overlapSizeClass} flex items-center justify-center filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] md:drop-shadow-[0_15px_30px_rgba(0,0,0,0.4)] transition-transform hover:scale-105 duration-300 z-50`}
                    >
                        {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-contain" style={{ maxWidth: 'none' }} />
                        ) : (
                            <div className="w-full h-full bg-black/5 rounded-full flex items-center justify-center text-[10px] text-gray-300 rotate-12 font-black border-2 border-dashed border-gray-300">NO IMG</div>
                        )}
                    </div>

                    {/* Price Badge - Bottom Right Corner */}
                    <div
                        className="absolute bottom-[-5%] right-[-5%] md:bottom-[-10%] md:right-[-10%] rotate-6 md:rotate-12 z-[60] pointer-events-none transition-transform duration-300 hover:scale-110 hover:rotate-0"
                    >
                        <div
                            className="w-20 h-20 md:w-28 md:h-28 rounded-full border-[3px] md:border-4 border-white flex flex-col items-center justify-center shadow-2xl text-black hover:bg-white transition-colors animate-pulse-slow"
                            style={{ backgroundColor: primaryColor }}
                        >
                            <span className="text-[9px] md:text-[10px] font-bold uppercase leading-none mt-1 opacity-80">Solo</span>
                            <span className="text-xl md:text-3xl font-black leading-none my-0.5">Q{Math.floor(item.price)}</span>
                            <span className="text-[9px] md:text-[10px] font-bold leading-none opacity-80">.{String(Number(item.price).toFixed(2)).split('.')[1]}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VARIANT: LUXE (Background Image) ---
    if (variant === 'luxe') {
        return (
            <div
                className="group relative w-full aspect-[4/5] md:aspect-[3/4] rounded-xl overflow-hidden shadow-xl cursor-pointer min-h-[220px]"
                style={{ backgroundColor: cardColor || '#1a1a1a' }}
                onClick={() => onOpenLightbox && onOpenLightbox(item)}
            >
                {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                    <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center text-white/20 text-xs">NO IMAGE</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                <div className="absolute top-3 left-3 bg-white/10 backdrop-blur border border-white/20 px-3 py-1 rounded-full text-white font-bold text-xs md:text-sm shadow-lg z-20">
                    Q{Number(item.price).toFixed(2)}
                </div>

                <div className="absolute bottom-0 inset-x-0 p-3 md:p-4 z-20 flex flex-col justify-end pointer-events-none">
                    <h3 className="text-white font-bold text-lg md:text-xl leading-tight drop-shadow-md mb-1 break-words">{item.name}</h3>
                    {item.description && <p className="text-white/80 text-[10px] md:text-xs line-clamp-2 md:block drop-shadow-sm leading-relaxed">{item.description}</p>}

                    <div className="mt-3 md:mt-4 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                        {qty > 0 ? (
                            <div className="bg-black/50 backdrop-blur rounded-full inline-block">
                                <QuantityControl quantity={qty} onAdd={onAdd} onRemove={onRemove} color={primaryColor} />
                            </div>
                        ) : (
                            <button onClick={onAdd} style={{ backgroundColor: primaryColor }} className="w-full py-2.5 md:py-3 rounded-lg text-black font-bold uppercase text-[10px] md:text-xs tracking-widest hover:brightness-110 shadow-lg">
                                Agregar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- VARIANT: EDITORIAL (Minimal / Asymmetric) ---
    if (variant === 'editorial') {
        return (
            <div className="flex flex-col gap-4 group">
                <div
                    className="relative w-full overflow-hidden rounded-sm cursor-pointer"
                    onClick={() => onOpenLightbox && onOpenLightbox(item)}
                >
                    <div className={getImageClass()}>
                        {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter brightness-90 group-hover:brightness-100" />
                        ) : (
                            <div className="w-full h-full bg-[#222] flex items-center justify-center text-gray-600 text-xs">No Image</div>
                        )}
                    </div>
                    {hasModifiers && (
                        <div className="absolute bottom-2 right-2 bg-[#D4AF37] text-black px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest shadow-sm flex items-center gap-1 z-10 rounded-sm opacity-90">
                            <SlidersHorizontal size={8} /> <span className="hidden md:inline">Personalizable</span>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-baseline border-b border-gray-800 pb-2">
                        <h3 className="text-white font-serif text-xl md:text-2xl leading-none">{item.name}</h3>
                        <span className="font-serif text-lg text-[#D4AF37]">Q{Number(item.price).toFixed(2)}</span>
                    </div>
                    {item.description && <p className="text-gray-400 text-xs font-sans leading-relaxed line-clamp-3">{item.description}</p>}

                    <div className="pt-2">
                        {qty > 0 ? (
                            <QuantityControl quantity={qty} onAdd={onAdd} onRemove={onRemove} color={primaryColor} style="compact" />
                        ) : (
                            <button onClick={onAdd} className="text-xs uppercase tracking-widest text-gray-500 hover:text-white border-b border-transparent hover:border-white transition-all pb-0.5">
                                + Agregar al pedido
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- VARIANT: CLASSIC (Default) ---
    // Check for specific template overrides
    const isOrganic = themeConfig.templateId?.includes('organic');

    // --- VARIANT: COMPACT (Grid Compact - Instagram Style) ---
    if (variant === 'compact') {
        return (
            <div
                className="group relative flex flex-col gap-2 cursor-pointer pb-2"
                onClick={() => onOpenLightbox && onOpenLightbox(item)}
            >
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-800">
                    {item.image_url ? (
                        <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">Sin Foto</div>
                    )}

                    {/* Floating Price Badge */}
                    <div className="absolute bottom-1.5 right-1.5 bg-black/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
                        Q{Number(item.price).toFixed(0)}
                    </div>

                    {/* Qty Badge */}
                    {qty > 0 && (
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-[var(--primary-color)] text-black rounded-full flex items-center justify-center font-bold text-xs shadow-md z-20" style={{ backgroundColor: primaryColor }}>
                            {qty}
                        </div>
                    )}

                    {/* Add Button Overlay (Mobile Touch Target) */}
                    <div className="absolute inset-0 z-0" />
                </div>

                <div className="flex flex-col gap-0.5 px-0.5">
                    <h3 className="font-bold text-xs md:text-sm leading-tight text-white line-clamp-1">{item.name}</h3>
                    {hasModifiers ? (
                        <span className="text-[10px] text-gray-400">Personalizable</span>
                    ) : (
                        /* Hidden description for compact to keep grid clean */
                        null
                    )}
                </div>
                {/* Invisible Add Action for whole card click handled by parent or specific button? 
                     User said: "Image... Badge... Text title".
                     We usually rely on lightbox to add? Or generic Add button?
                     If compact, maybe we need a small '+' button? 
                     I'll stick to simple layout. Clicking opens Lightbox (as per existing logic).
                  */}
            </div>
        )
    }

    // --- VARIANT: LIST (Minimal List) ---
    if (variant === 'list') {
        return (
            <div
                className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 active:bg-white/10 transition-colors cursor-pointer"
                onClick={() => onOpenLightbox && onOpenLightbox(item)}
            >
                {/* Left Image */}
                <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-black/20">
                    {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">No img</div>
                    )}
                    {qty > 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="font-bold text-white text-lg">{qty}</span>
                        </div>
                    )}
                </div>

                {/* Right Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between h-24 py-1">
                    <div>
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-bold text-sm text-white line-clamp-2 leading-tight">{item.name}</h3>
                            <span className="font-bold text-sm text-[var(--primary-color)] whitespace-nowrap" style={{ color: primaryColor }}>Q{item.price}</span>
                        </div>
                        {item.description && <p className="text-xs text-gray-400 line-clamp-2 mt-1 leading-relaxed">{item.description}</p>}
                    </div>

                    <div className="mt-auto pt-2 flex justify-end">
                        {qty > 0 ? (
                            <QuantityControl quantity={qty} onAdd={onAdd} onRemove={onRemove} color={primaryColor} style="minimal" />
                        ) : (
                            <button
                                onClick={(e) => { e.stopPropagation(); onAdd(); }}
                                className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition-colors text-white"
                            >
                                Agregar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // --- VARIANT: CARD PREMIUM (Original Classic) ---
    return (
        <div
            className="flex flex-col gap-3 p-3 transition-all group rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10"
            style={{
                backgroundColor: cardColor || 'rgba(255,255,255,0.03)'
            }}
        >
            <div
                className={`relative w-full overflow-hidden bg-black/20 cursor-pointer ${getImageClass()} ${isOrganic ? '!rounded-full aspect-square' : 'rounded-xl'
                    }`}
                onClick={() => onOpenLightbox && onOpenLightbox(item)}
            >
                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.name}
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOrganic ? 'rounded-full' : ''}`}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">Sin Foto</div>
                )}
                {qty > 0 && (
                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] ${isOrganic ? 'rounded-full' : ''}`}>
                        <span className="text-white font-bold text-2xl">{qty}</span>
                    </div>
                )}
                {hasModifiers && (
                    <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur text-white text-[9px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wide border border-white/10">
                        Opciones
                    </div>
                )}
            </div>

            <div className="flex justify-between items-start gap-2">
                <div>
                    <h3 className="font-bold text-base md:text-lg line-clamp-1 text-white">
                        {item.name}
                    </h3>
                    <p className="text-gray-400 text-xs line-clamp-2 mt-1 min-h-[2.5em]">{item.description}</p>
                </div>
                <span className="text-white font-bold whitespace-nowrap bg-white/10 px-2 py-1 rounded text-xs">Q{item.price}</span>
            </div>

            <div className="mt-auto pt-2">
                {qty > 0 ? (
                    <QuantityControl quantity={qty} onAdd={onAdd} onRemove={onRemove} color={primaryColor} style="compact" />
                ) : (
                    <button
                        onClick={onAdd}
                        className="w-full py-2 bg-white/5 hover:bg-[var(--primary-color)] hover:text-black rounded-lg text-xs font-bold uppercase transition-colors"
                        style={{ '--primary-color': primaryColor } as any}
                    >
                        Agregar
                    </button>
                )}
            </div>
        </div>
    );
}
