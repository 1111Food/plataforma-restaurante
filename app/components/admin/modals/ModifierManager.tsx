'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Plus, Trash2, Save, X, ChevronRight, ChevronDown, CheckSquare, Circle } from 'lucide-react'
import Modal from '../../ui/Modal'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ModifierOption = {
    id: string
    group_id: string
    name: string
    price_adjustment: number
    is_available: boolean
}

type ModifierGroup = {
    id: string
    restaurant_id: string
    name: string
    min_selection: number // 0 = Optional, 1 = Required
    max_selection: number // 1 = Radio, >1 = Checkbox
    options?: ModifierOption[]
}

type Props = {
    isOpen: boolean
    onClose: () => void
    restaurantId: string
    groups: ModifierGroup[]
    onUpdate: () => void // Trigger re-fetch in parent
}

export default function ModifierManager({ isOpen, onClose, restaurantId, groups, onUpdate }: Props) {
    const [selectedGroup, setSelectedGroup] = useState<ModifierGroup | null>(null)
    const [newGroupName, setNewGroupName] = useState('')

    // Sync selectedGroup with props when groups update
    useEffect(() => {
        if (selectedGroup) {
            const updated = groups.find(g => g.id === selectedGroup.id)
            if (updated) setSelectedGroup(updated)
        }
    }, [groups])

    // Create Group State
    const [isCreating, setIsCreating] = useState(false)

    // Option State
    const [newOptionName, setNewOptionName] = useState('')
    const [newOptionPrice, setNewOptionPrice] = useState('')

    // --- GROUP LOGIC ---
    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newGroupName.trim()) return

        if (!restaurantId) {
            alert('CRITICAL ERROR: No Restaurant ID provided to component.')
            console.error('Missing restaurantId in props')
            return
        }

        const { error } = await supabase
            .from('modifier_groups')
            .insert([{
                restaurant_id: restaurantId,
                name: newGroupName,
                min_selection: 0, // Default Optional
                max_selection: 1  // Default Single Select
            }])

        if (error) {
            console.error('Error creando grupo FULL:', error)
            alert(`ERROR: ${error.message}\nCODE: ${error.code}\nDETAILS: ${error.details || 'N/A'}`)
        } else {
            setNewGroupName('')
            setIsCreating(false)
            onUpdate()
        }
    }

    const handleDeleteGroup = async (id: string) => {
        if (!confirm('¿Eliminar este grupo y sus opciones?')) return
        const { error } = await supabase.from('modifier_groups').delete().eq('id', id)
        if (!error) {
            if (selectedGroup?.id === id) setSelectedGroup(null)
            onUpdate()
        }
    }

    const updateGroupSettings = async (id: string, updates: any) => {
        const { error } = await supabase.from('modifier_groups').update(updates).eq('id', id)
        if (!error) onUpdate()
    }

    // --- OPTION LOGIC ---
    const handleAddOption = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedGroup || !newOptionName.trim()) return

        const price = parseFloat(newOptionPrice) || 0

        const { error } = await supabase
            .from('modifier_options')
            .insert([{
                group_id: selectedGroup.id,
                name: newOptionName,
                price_adjustment: price
            }])

        if (error) {
            console.error(error)
        } else {
            setNewOptionName('')
            setNewOptionPrice('')
            onUpdate()
            // Optimistic update for UI feel (optional because onUpdate will refresh)
        }
    }

    const handleDeleteOption = async (id: string) => {
        const { error } = await supabase.from('modifier_options').delete().eq('id', id)
        if (!error) onUpdate()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Gestor de Extras y Opciones">
            <div className="flex h-[60vh] gap-4">
                {/* LEFT: Group List */}
                <div className="w-1/3 border-r border-white/10 pr-4 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-neutral-400">Grupos</h4>
                        <button onClick={() => setIsCreating(true)} className="text-amber-500 hover:text-amber-400">
                            <Plus size={20} />
                        </button>
                    </div>

                    {isCreating && (
                        <form onSubmit={handleCreateGroup} className="mb-4 flex gap-2">
                            <input
                                autoFocus
                                className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white focus:border-amber-500 outline-none"
                                placeholder="Nombre..."
                                value={newGroupName}
                                onChange={e => setNewGroupName(e.target.value)}
                            />
                            <button className="text-green-500"><Save size={16} /></button>
                        </form>
                    )}

                    <div className="overflow-y-auto flex-1 space-y-2">
                        {groups.map(group => (
                            <div
                                key={group.id}
                                onClick={() => setSelectedGroup(group)}
                                className={`p-3 rounded-lg cursor-pointer transition flex justify-between items-center ${selectedGroup?.id === group.id ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800'}`}
                            >
                                <span className="font-medium text-sm truncate">{group.name}</span>
                                {selectedGroup?.id === group.id && <ChevronRight size={16} />}
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: Details & Options */}
                <div className="flex-1 overflow-y-auto pl-2">
                    {selectedGroup ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* Group Header & Settings */}
                            <div className="bg-neutral-900/50 p-4 rounded-xl border border-white/5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{selectedGroup.name}</h3>
                                        <p className="text-xs text-neutral-500">Configura como se comportan las opciones.</p>
                                    </div>
                                    <button onClick={() => handleDeleteGroup(selectedGroup.id)} className="text-red-500/50 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Selection Type */}
                                    <div>
                                        <label className="text-xs text-neutral-400 block mb-1">Tipo de Selección</label>
                                        <div className="flex bg-black rounded p-1 border border-white/10">
                                            <button
                                                onClick={() => updateGroupSettings(selectedGroup.id, { max_selection: 1 })}
                                                className={`flex-1 text-xs py-1 rounded flex items-center justify-center gap-1 ${selectedGroup.max_selection === 1 ? 'bg-amber-500 text-black font-bold' : 'text-neutral-500'}`}
                                            >
                                                <Circle size={10} /> Única
                                            </button>
                                            <button
                                                onClick={() => updateGroupSettings(selectedGroup.id, { max_selection: 5 })} // Arbitrary > 1 for Multi
                                                className={`flex-1 text-xs py-1 rounded flex items-center justify-center gap-1 ${selectedGroup.max_selection > 1 ? 'bg-amber-500 text-black font-bold' : 'text-neutral-500'}`}
                                            >
                                                <CheckSquare size={10} /> Múltiple
                                            </button>
                                        </div>
                                    </div>

                                    {/* Requirement */}
                                    <div>
                                        <label className="text-xs text-neutral-400 block mb-1">Requisito</label>
                                        <div className="flex bg-black rounded p-1 border border-white/10">
                                            <button
                                                onClick={() => updateGroupSettings(selectedGroup.id, { min_selection: 0 })}
                                                className={`flex-1 text-xs py-1 rounded flex items-center justify-center gap-1 ${selectedGroup.min_selection === 0 ? 'bg-green-500/20 text-green-500 font-bold' : 'text-neutral-500'}`}
                                            >
                                                Opcional
                                            </button>
                                            <button
                                                onClick={() => updateGroupSettings(selectedGroup.id, { min_selection: 1 })}
                                                className={`flex-1 text-xs py-1 rounded flex items-center justify-center gap-1 ${selectedGroup.min_selection > 0 ? 'bg-red-500/20 text-red-500 font-bold' : 'text-neutral-500'}`}
                                            >
                                                Obligatorio
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Options List */}
                            <div>
                                <h4 className="text-sm font-bold text-neutral-400 mb-2">Opciones ({selectedGroup.options?.length || 0})</h4>

                                <div className="space-y-2 mb-4">
                                    {(selectedGroup.options || []).map(opt => (
                                        <div key={opt.id} className="flex items-center justify-between bg-neutral-900 border border-white/5 p-3 rounded-lg group">
                                            <span className="text-sm text-white font-medium">{opt.name}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-amber-500 font-mono">
                                                    {opt.price_adjustment > 0 ? `+$${opt.price_adjustment}` : 'Gratis'}
                                                </span>
                                                <button onClick={() => handleDeleteOption(opt.id)} className="text-neutral-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Option Form */}
                                <form onSubmit={handleAddOption} className="flex gap-2 items-center bg-black/50 p-2 rounded-xl border border-dashed border-white/20">
                                    <input
                                        className="flex-1 bg-transparent text-sm text-white px-2 outline-none"
                                        placeholder="Nueva opción (Ej. Queso Cheddar)"
                                        value={newOptionName}
                                        onChange={e => setNewOptionName(e.target.value)}
                                    />
                                    <div className="w-px h-6 bg-white/10"></div>
                                    <input
                                        className="w-20 bg-transparent text-sm text-white px-2 outline-none text-right"
                                        placeholder="0.00"
                                        type="number"
                                        value={newOptionPrice}
                                        onChange={e => setNewOptionPrice(e.target.value)}
                                    />
                                    <button className="bg-white/10 text-white rounded-lg p-2 hover:bg-white hover:text-black transition">
                                        <Plus size={16} />
                                    </button>
                                </form>
                            </div>

                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-4">
                            <CheckSquare size={48} className="opacity-20" />
                            <p className="text-sm text-center max-w-[200px]">Selecciona o crea un grupo para editar sus opciones.</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    )
}
