import { useState } from 'react';
import { Plus, Eye, ZoomIn, Maximize2 } from 'lucide-react';
import QuantityControl from '../QuantityControl';

type MenuItem = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    image_url: string | null;
    detail_image_url?: string | null;
    is_available: boolean;
    is_featured?: boolean;
};

type Restaurant = {
    card_color?: string | null;
    primary_color?: string;
    [key: string]: any;
};

interface MenuTemplateProps {
    items: MenuItem[];
    restaurant: Restaurant;
    addToCart: (item: MenuItem) => void;
    removeOne: (itemId: string) => void;
    cartItems: any[];
    onOpenLightbox?: (item: MenuItem) => void; // New Prop
}

function UrbanCard({ item, restaurant, addToCart, removeOne, getQty, onOpenLightbox }: any) {
    const qty = getQty(item.id);
    // Removed local showDetail state in favor of Lightbox
    // But if we want to show detail ON CARD on hover or click, we might keep it.
    // User requested "Click Opens Modal".
    // I will keep the image activeImage as main image mostly, but if we want preview logic we can add it back.
    // For now, simple: Display Main. Click -> Lightbox (Dual).

    const hasDetail = !!item.detail_image_url;

    return (
        <div
            className="group relative flex flex-col overflow-hidden bg-[#121212] rounded-none md:rounded-xl shadow-lg transition-transform duration-200"
            style={{
                boxShadow: qty > 0 ? `0 0 0 2px ${restaurant.primary_color}` : 'none'
            }}
        >
            {/* IMAGE CONTAINER 4:5 Aspect Ratio - CLICKABLE */}
            <div
                className="w-full aspect-[4/5] relative bg-neutral-900 group-image cursor-pointer"
                onClick={() => onOpenLightbox && onOpenLightbox(item)}
            >
                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600 font-bold uppercase tracking-widest">Sin Foto</div>
                )}

                {/* Gradient Overlay */}
                <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none"></div>

                {/* Price Badge */}
                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-white font-black text-xs md:text-sm px-2 py-1 rounded-md shadow-lg border border-white/10 z-10 pointer-events-none">
                    Q{Number(item.price).toFixed(0)}
                </div>

                {/* INDICATOR: Expand / Multiple Photos */}
                {(hasDetail || onOpenLightbox) && (
                    <div className="absolute top-2 left-2 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-black/50 backdrop-blur-md p-1.5 rounded-full border border-white/20 text-white shadow-lg">
                            <Maximize2 size={14} />
                        </div>
                    </div>
                )}
            </div>

            {/* CONTENT */}
            <div className="absolute bottom-0 left-0 right-0 p-3 pt-6 flex flex-col gap-2 z-20 pointer-events-none">
                {/* Title */}
                <h3 className="font-black text-sm md:text-base text-white leading-none uppercase tracking-tight drop-shadow-md pr-8">
                    {item.name}
                </h3>

                {/* Photos Indicator (Dots) */}
                {hasDetail && (
                    <div className="flex gap-1 mb-1 opacity-80">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
                    </div>
                )}

                {/* Action Area - Pointer Events Auto to allow clicking buttons */}
                <div className="w-full pointer-events-auto">
                    {qty > 0 ? (
                        <div className="shadow-2xl">
                            <QuantityControl
                                quantity={qty}
                                onAdd={() => addToCart(item)}
                                onRemove={() => removeOne(item.id)}
                                color={restaurant.primary_color || '#FFB800'}
                                style="compact"
                            />
                        </div>
                    ) : (
                        <button
                            onClick={() => addToCart(item)}
                            className="w-full py-2 rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all active:scale-95 shadow-lg backdrop-blur-md border border-white/5"
                            style={{
                                backgroundColor: restaurant.primary_color || '#FFB800',
                                color: '#000'
                            }}
                        >
                            AGREGAR
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function UrbanGrid({ items, restaurant, addToCart, removeOne, cartItems, onOpenLightbox }: MenuTemplateProps) {
    const getQty = (id: string) => cartItems.filter(i => i.productId === id || i.id === id).reduce((acc, item) => acc + item.quantity, 0);

    const handleRemove = (productId: string) => {
        const matches = cartItems.filter(i => i.productId === productId || i.id === productId);
        if (matches.length > 0) {
            const target = matches[matches.length - 1];
            removeOne(target.id);
        }
    }

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-4 pb-20">
            {items.map((item) => (
                <UrbanCard
                    key={item.id}
                    item={item}
                    restaurant={restaurant}
                    addToCart={addToCart}
                    removeOne={handleRemove} // Pass handleRemove instead of raw removeOne
                    getQty={getQty}
                    onOpenLightbox={onOpenLightbox}
                />
            ))}
        </div>
    );
}
