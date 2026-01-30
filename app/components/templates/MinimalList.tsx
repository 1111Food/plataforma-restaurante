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

export default function MinimalList({ items, restaurant, addToCart, removeOne, cartItems, onOpenLightbox }: MenuTemplateProps) {
    const getQty = (id: string) => cartItems.filter(i => i.productId === id || i.id === id).reduce((acc, item) => acc + item.quantity, 0);

    const handleRemove = (productId: string) => {
        const matches = cartItems.filter(i => i.productId === productId || i.id === productId);
        if (matches.length > 0) {
            const target = matches[matches.length - 1];
            removeOne(target.id);
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-2">
            {items.map((item) => {
                const qty = getQty(item.id);

                return (
                    <div
                        key={item.id}
                        onClick={qty === 0 ? () => addToCart(item) : undefined}
                        className="group flex gap-5 items-center p-4 border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                        {/* Thumbnail Image Left */}
                        <div
                            className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden bg-neutral-900 shrink-0 border border-white/5 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={(e) => {
                                if (onOpenLightbox && item.image_url) {
                                    e.stopPropagation();
                                    onOpenLightbox(item);
                                }
                            }}
                        >
                            {item.image_url ? (
                                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600">Sin Foto</div>
                            )}
                        </div>

                        {/* Content Right */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="font-medium text-base md:text-lg text-white group-hover:text-[var(--primary-color)] transition-colors line-clamp-1">{item.name}</h3>
                                    <p className="text-xs md:text-sm text-neutral-500 mt-1 line-clamp-2 leading-relaxed font-light">
                                        {item.description}
                                    </p>
                                </div>

                                <span className="font-mono text-sm md:text-base font-bold text-white shrink-0 mt-1">
                                    Q{Number(item.price).toFixed(2)}
                                </span>
                            </div>

                            {/* Action Area below, aligned right */}
                            <div className="mt-3 flex justify-end min-h-[32px]">
                                {qty > 0 ? (
                                    <QuantityControl
                                        quantity={qty}
                                        onAdd={() => addToCart(item)}
                                        onRemove={() => handleRemove(item.id)}
                                        color={restaurant.primary_color || '#FFB800'}
                                        style="minimal"
                                    />
                                ) : (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                                        className="text-xs font-bold uppercase tracking-wider text-[var(--primary-color)] opacity-0 group-hover:opacity-100 transition-opacity hover:underline underline-offset-4"
                                    >
                                        + Agregar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
