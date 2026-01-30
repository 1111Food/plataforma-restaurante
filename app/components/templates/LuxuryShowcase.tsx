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

// ... props interface
interface MenuTemplateProps {
    items: MenuItem[];
    restaurant: Restaurant;
    addToCart: (item: MenuItem) => void;
    removeOne: (itemId: string) => void;
    cartItems: any[];
    onOpenLightbox?: (item: MenuItem) => void; // New Prop
}

export default function LuxuryShowcase({ items, restaurant, addToCart, removeOne, cartItems, onOpenLightbox }: MenuTemplateProps) {
    const getQty = (id: string) => cartItems.filter(i => i.productId === id || i.id === id).reduce((acc, item) => acc + item.quantity, 0);

    const handleRemove = (productId: string) => {
        const matches = cartItems.filter(i => i.productId === productId || i.id === productId);
        if (matches.length > 0) {
            const target = matches[matches.length - 1];
            removeOne(target.id);
        }
    }

    return (
        <div className="space-y-16 py-8">
            {items.map((item) => {
                const qty = getQty(item.id);

                return (
                    <div
                        key={item.id}
                        className="group relative flex flex-col items-center text-center gap-6"
                    >
                        {/* Giant Image (Full Width on Mobile, Max Width on Desktop) */}
                        <div
                            className="w-full max-w-4xl aspect-[4/3] md:aspect-[21/9] rounded-2xl overflow-hidden bg-[#0a0a0a] relative shadow-2xl group-hover:shadow-[0_0_30px_rgba(255,184,0,0.1)] transition-shadow duration-700 cursor-pointer"
                            onClick={() => onOpenLightbox && onOpenLightbox(item)}
                        >
                            {item.image_url ? (
                                item.image_url.endsWith('.mp4') ? (
                                    <video src={item.image_url} autoPlay muted loop className="w-full h-full object-cover transform transition duration-1000 opacity-80 group-hover:opacity-100 group-hover:scale-105" />
                                ) : (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transform transition duration-1000 opacity-80 group-hover:opacity-100 group-hover:scale-105" />
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm opacity-30 tracking-widest uppercase text-white">Sin Imagen Disponible</div>
                            )}

                            {/* Overlay Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 pointer-events-none"></div>

                            {/* Floating Quantity Control Centered over image bottom */}
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20" onClick={(e) => e.stopPropagation()}>
                                {qty > 0 ? (
                                    // ... controls
                                    <QuantityControl
                                        quantity={qty}
                                        onAdd={() => addToCart(item)}
                                        onRemove={() => handleRemove(item.id)}
                                        color={restaurant.primary_color || '#FFB800'}
                                    />
                                ) : (
                                    <button
                                        onClick={() => addToCart(item)}
                                        className="px-8 py-3 rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 border backdrop-blur-md bg-black/30 hover:bg-[var(--primary-color)] hover:text-black hover:border-[var(--primary-color)] text-white border-white/30"
                                    >
                                        Agregar al Pedido
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Elegant Text */}
                        <div className="max-w-2xl space-y-3 px-4">
                            <h3 className="font-serif text-3xl md:text-5xl text-white tracking-tight">{item.name}</h3>
                            <div className="w-16 h-[1px] bg-[var(--primary-color)] mx-auto opacity-50"></div>

                            <p className="text-neutral-400 font-light text-base md:text-xl leading-relaxed">
                                {item.description}
                            </p>

                            <div className="pt-2">
                                <span className="font-serif text-2xl md:text-3xl italic opacity-80" style={{ color: 'var(--primary-color)' }}>
                                    Q{Number(item.price).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div >
    );
}
