import { Minus, Plus } from 'lucide-react';

interface QuantityControlProps {
    quantity: number;
    onAdd: () => void;
    onRemove: () => void;
    color: string;
    style?: 'default' | 'compact' | 'minimal';
}

export default function QuantityControl({ quantity, onAdd, onRemove, color, style = 'default' }: QuantityControlProps) {
    if (quantity === 0) return null;

    if (style === 'minimal') {
        return (
            <div className="flex items-center gap-3 bg-white/5 rounded-full px-2 py-1">
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
                >
                    <Minus size={14} />
                </button>
                <span className="text-sm font-bold text-white min-w-[1ch] text-center">{quantity}</span>
                <button
                    onClick={(e) => { e.stopPropagation(); onAdd(); }}
                    className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                    style={{ color: color }}
                >
                    <Plus size={14} />
                </button>
            </div>
        );
    }

    if (style === 'compact') {
        return (
            <div className="flex items-center justify-between bg-neutral-800 rounded-lg overflow-hidden w-full h-8">
                <button
                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                    className="h-full w-8 flex items-center justify-center hover:bg-white/10 text-white transition-colors"
                >
                    <Minus size={14} />
                </button>
                <span className="text-xs font-bold text-white">{quantity}</span>
                <button
                    onClick={(e) => { e.stopPropagation(); onAdd(); }}
                    className="h-full w-8 flex items-center justify-center hover:bg-white/10 transition-colors"
                    style={{ backgroundColor: color, color: '#000' }}
                >
                    <Plus size={14} strokeWidth={3} />
                </button>
            </div>
        );
    }

    // Default (Luxury/Standard)
    return (
        <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md rounded-full px-1 py-1 border border-white/10 shadow-xl">
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-all active:scale-95"
            >
                <Minus size={18} />
            </button>

            <span className="text-lg font-bold text-white min-w-[2ch] text-center">{quantity}</span>

            <button
                onClick={(e) => { e.stopPropagation(); onAdd(); }}
                className="w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95 shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                style={{ backgroundColor: color, color: '#000' }}
            >
                <Plus size={18} strokeWidth={3} />
            </button>
        </div>
    );
}
