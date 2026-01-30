import { Plus } from 'lucide-react';
import QuantityControl from '../QuantityControl';
import { formatCurrency } from '../../utils/formatCurrency';

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
    addedId: string | null;
    onOpenLightbox?: (item: MenuItem) => void;
}

export default function ClassicGrid({ items, restaurant, addToCart, removeOne, cartItems, addedId, onOpenLightbox }: MenuTemplateProps) {
    // FIX: Sum quantity by productId because items with modifiers have unique IDs
    const getQty = (id: string) => cartItems.filter(i => i.productId === id || i.id === id).reduce((acc, item) => acc + item.quantity, 0);

    // FIX: Remove logic needs to find a specific cart item to remove since IDs are composite
    // We remove the most recently added one (pseudo-LIFO) to start decrementing
    const handleRemove = (productId: string) => {
        // Find cart items matching this product
        const matches = cartItems.filter(i => i.productId === productId || i.id === productId);
        if (matches.length > 0) {
            // Pick the last one (or any)
            const target = matches[matches.length - 1]; // Last added usually at end
            removeOne(target.id);
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => {
                const qty = getQty(item.id);
                // @ts-ignore
                const hasModifiers = item.item_modifiers && item.item_modifiers.length > 0;

                return (
                    <div
                        key={item.id}
                        className="group relative flex flex-col sm:flex-row gap-4 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
                        style={{
                            backgroundColor: restaurant.card_color || 'rgba(255,255,255,0.03)',
                            backdropFilter: 'blur(10px)',
                            border: addedId === item.id ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.05)'
                        }}
                    >
                        <div
                            className="w-full sm:w-32 aspect-square rounded-xl overflow-hidden bg-white/5 relative shrink-0 cursor-pointer"
                            onClick={(e) => {
                                if (onOpenLightbox && item.image_url) {
                                    e.stopPropagation();
                                    onOpenLightbox(item);
                                }
                            }}
                        >
                            {item.image_url ? (
                                item.image_url.endsWith('.mp4') ? (
                                    <video src={item.image_url} autoPlay muted loop className="w-full h-full object-cover" />
                                ) : (
                                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                )
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs opacity-30">Sin Foto</div>
                            )}

                            {/* CUSTOMIZABLE BADGE */}
                            {hasModifiers && (
                                <div className="absolute top-2 left-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg z-10">
                                    PERSONALIZABLE
                                </div>
                            )}

                            {/* Mobile Quick Add - StopProp needed */}
                            <button
                                className={`absolute bottom-2 right-2 p-2 rounded-full shadow-lg sm:hidden active:scale-90 transition-transform ${addedId === item.id ? 'bg-green-500 text-white' : 'bg-[var(--primary-color)] text-black'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(item);
                                }}
                            >
                                <Plus size={18} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
                                    <span className="font-bold text-lg ml-2" style={{ color: 'var(--primary-color)' }}>
                                        {formatCurrency(item.price)}
                                    </span>
                                </div>
                                <p className="text-sm opacity-70 line-clamp-2 leading-relaxed">
                                    {item.description}
                                </p>
                            </div>

                            <div className="hidden sm:flex items-center justify-end mt-3">
                                {qty > 0 ? (
                                    <QuantityControl
                                        quantity={qty}
                                        onAdd={() => addToCart(item)}
                                        onRemove={() => handleRemove(item.id)}
                                        color={restaurant.primary_color || '#FFB800'}
                                        style="compact"
                                    />
                                ) : (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            addToCart(item);
                                        }}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition ${addedId === item.id ? 'bg-green-500 text-white' : 'hover:brightness-110'}`}
                                        style={{ backgroundColor: addedId === item.id ? '' : 'var(--primary-color)', color: addedId === item.id ? '' : '#000' }}
                                    >
                                        {addedId === item.id ? 'AGREGADO!' : hasModifiers ? 'AGREGAR' : 'AGREGAR'} <Plus size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    );
}
