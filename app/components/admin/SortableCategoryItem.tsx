import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit2, Trash2, Save, X } from 'lucide-react';

interface SortableCategoryItemProps {
    cat: any;
    editingCat: any;
    setEditingCat: (cat: any) => void;
    handleUpdateCategory: () => void;
    handleDeleteCategory: (id: string) => void;
}

export function SortableCategoryItem({
    cat,
    editingCat,
    setEditingCat,
    handleUpdateCategory,
    handleDeleteCategory
}: SortableCategoryItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: cat.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : 1,
        position: 'relative' as 'relative',
        touchAction: 'none' // Important for pointers
    };

    return (
        <div ref={setNodeRef} style={style} className="flex gap-2 items-center bg-neutral-900 p-3 rounded-lg border border-white/5">
            {/* Grip Handle */}
            <div {...attributes} {...listeners} className="cursor-grab text-neutral-600 hover:text-white p-1 hover:bg-white/10 rounded">
                <GripVertical size={16} />
            </div>

            {editingCat?.id === cat.id ? (
                // Edit Mode
                <>
                    <input
                        className="flex-1 bg-black border border-amber-500/50 rounded px-2 py-1 text-sm text-white outline-none"
                        value={editingCat.name}
                        onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })}
                        autoFocus
                    />
                    <button onClick={handleUpdateCategory} className="text-green-500 hover:text-green-400 p-1"><Save size={16} /></button>
                    <button onClick={() => setEditingCat(null)} className="text-red-500 hover:text-red-400 p-1"><X size={16} /></button>
                </>
            ) : (
                // View Mode
                <>
                    <span className="flex-1 text-sm text-neutral-300 font-medium">{cat.name}</span>
                    <button onClick={() => setEditingCat({ id: cat.id, name: cat.name })} className="text-neutral-500 hover:text-white p-1"><Edit2 size={14} /></button>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-red-900 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                </>
            )}
        </div>
    );
}
