import { Plus } from 'lucide-react';
import QuantityControl from '../QuantityControl';

type MenuItem = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    image_url: string | null;
    is_available: boolean;
    is_featured?: boolean;
};

type Restaurant = {
    card_color?: string | null;
    primary_color?: string;
    secondary_color?: string; // Assuming accessing settings from here
    [key: string]: any;
};

interface MenuTemplateProps {
    items: MenuItem[];
    restaurant: Restaurant;
    addToCart: (item: MenuItem) => void;
    removeOne: (itemId: string) => void;
    cartItems: any[];
    onOpenLightbox?: (item: MenuItem) => void;
}

export default function MenuThemeLuxe({ items, restaurant, addToCart, removeOne, cartItems, onOpenLightbox }: MenuTemplateProps) {
    const getQty = (id: string) => cartItems.filter(i => i.productId === id || i.id === id).reduce((acc, item) => acc + item.quantity, 0);

    const handleRemove = (productId: string) => {
        const matches = cartItems.filter(i => i.productId === productId || i.id === productId);
        if (matches.length > 0) {
            const target = matches[matches.length - 1];
            removeOne(target.id);
        }
    }

    return (
        <div className="py-4 md:py-8">
            {/* Grid System: 2 cols on mobile, 3 on tablet, 4 on desktop */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 px-2 md:px-0">
                {items.map((item) => {
                    const qty = getQty(item.id);

                    return (
                        <div
                            key={item.id}
                            className="group relative w-full aspect-[3/4] rounded-xl overflow-hidden shadow-lg transform transition-all duration-300 hover:scale-[1.02]"
                            style={{ backgroundColor: restaurant.card_color || '#1a1a1a' }}
                            onClick={() => onOpenLightbox && onOpenLightbox(item)}
                        >
                            {/* Background Image */}
                            {item.image_url ? (
                                <img
                                    src={item.image_url}
                                    alt={item.name}
                                    className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
                                    <span className="text-white/20 text-xs uppercase tracking-widest">Sin Foto</span>
                                </div>
                            )}

                            {/* Gradient Overlay for Readability */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

                            {/* Price Badge (Top Left) */}
                            <div className="absolute top-2 left-2 z-20">
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full shadow-lg">
                                    <span className="text-white font-bold text-sm md:text-base">
                                        Q{Number(item.price).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Content (Bottom) */}
                            <div className="absolute bottom-0 left-0 right-0 p-3 md:p-5 z-20 flex flex-col justify-end h-full pointer-events-none">
                                <div className="mt-auto space-y-1">
                                    <h3 className="text-white font-bold text-base md:text-xl leading-tight line-clamp-2 drop-shadow-md">
                                        {item.name}
                                    </h3>
                                    {item.description && (
                                        <p className="text-white/70 text-xs md:text-sm line-clamp-2 md:line-clamp-3 hidden md:block">
                                            {item.description}
                                        </p>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="mt-3 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
                                    {qty > 0 ? (
                                        <div className="bg-black/60 backdrop-blur-sm rounded-full p-1 border border-white/10">
                                            <QuantityControl
                                                quantity={qty}
                                                onAdd={() => addToCart(item)}
                                                onRemove={() => handleRemove(item.id)}
                                                color={restaurant.primary_color || '#FFB800'}
                                            />
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                addToCart(item);
                                            }}
                                            className="w-full py-2 bg-white/10 hover:bg-[var(--primary-color)] hover:text-black hover:border-transparent cursor-pointer backdrop-blur-md border border-white/30 rounded-lg text-white text-xs md:text-sm font-bold uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 group/btn"
                                        >
                                            <span>Agregar</span>
                                            <Plus size={14} className="group-hover/btn:rotate-90 transition-transform" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
