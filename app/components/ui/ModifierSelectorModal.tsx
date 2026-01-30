'use client'

import { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import Modal from './Modal'
import { formatCurrency } from '../../utils/formatCurrency'

type ModifierOption = {
    id: string
    name: string
    price_adjustment: number
}

type ModifierGroup = {
    id: string
    name: string
    min_selection: number
    max_selection: number
    options: ModifierOption[]
}

type Props = {
    isOpen: boolean
    onClose: () => void
    item: any // MenuItem
    onAddToOrder: (item: any, selectedModifiers: any[], finalPrice: number) => void
}

export default function ModifierSelectorModal({ isOpen, onClose, item, onAddToOrder }: Props) {
    const [selections, setSelections] = useState<{ [groupId: string]: string[] }>({})

    // Normalize logic: item.item_modifiers might wrap the group
    // Expected structure from query: item_modifiers: [{ group: { ..., options: [] } }]
    const modifierGroups: ModifierGroup[] = item?.item_modifiers?.map((im: any) => im.group) || []

    // Reset when opening
    useEffect(() => {
        if (isOpen) setSelections({})
    }, [isOpen, item])

    if (!item) return null

    const handleToggleOption = (groupId: string, optionId: string, maxInfo: number) => {
        setSelections(prev => {
            const current = prev[groupId] || []
            const isSelected = current.includes(optionId)

            if (maxInfo === 1) {
                // Radio behavior (toggle off not usually allowed for required, but let's allow switching)
                // If it's already selected and min=0 (optional), usage might expect toggle off.
                // But generally Radio replaces.
                return { ...prev, [groupId]: [optionId] }
            } else {
                // Checkbox behavior
                if (isSelected) {
                    return { ...prev, [groupId]: current.filter(id => id !== optionId) }
                } else {
                    return { ...prev, [groupId]: [...current, optionId] }
                }
            }
        })
    }

    // Validation
    const isValid = modifierGroups.every(group => {
        const selectedCount = (selections[group.id] || []).length
        return selectedCount >= group.min_selection
    })

    // Calculate Totals
    let extrasTotal = 0
    const selectedModifiersDetails: any[] = []

    modifierGroups.forEach(group => {
        const groupSelections = selections[group.id] || []
        groupSelections.forEach(optId => {
            const opt = group.options.find(o => o.id === optId)
            if (opt) {
                extrasTotal += opt.price_adjustment
                selectedModifiersDetails.push({
                    id: opt.id,
                    name: opt.name,
                    price: opt.price_adjustment,
                    groupId: group.id,
                    groupName: group.name
                })
            }
        })
    })

    const finalPrice = item.price + extrasTotal

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Personaliza tu ${item.name}`}>
            <div className="space-y-6 pb-20">
                <p className="text-sm text-neutral-400 -mt-2">{item.description}</p>

                {modifierGroups.map(group => (
                    <div key={group.id} className="space-y-3">
                        <div className="flex justify-between items-end border-b border-white/5 pb-2">
                            <div>
                                <h4 className="font-bold text-white text-lg">{group.name}</h4>
                                <p className="text-[10px] text-neutral-500 uppercase tracking-widest">
                                    {group.max_selection === 1 ? 'Elige 1' : 'Elige varios'}
                                    {group.min_selection > 0 && <span className="text-amber-500 ml-1">• Obligatorio</span>}
                                </p>
                            </div>
                            {/* Validation Badge */}
                            {(selections[group.id] || []).length >= group.min_selection ? (
                                <span className="text-green-500 text-xs flex items-center gap-1"><Check size={12} /> Listo</span>
                            ) : (
                                <span className="text-amber-500 text-xs">Faltan opciones</span>
                            )}
                        </div>

                        <div className="space-y-2">
                            {group.options?.map(option => {
                                const isSelected = (selections[group.id] || []).includes(option.id)
                                return (
                                    <label
                                        key={option.id}
                                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-amber-500/10 border-amber-500/50' : 'bg-neutral-900 border-white/5 hover:border-white/20'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-neutral-600'}`}>
                                                {isSelected && <div className="w-2 h-2 bg-black rounded-full" />}
                                            </div>
                                            <span className={`text-sm ${isSelected ? 'text-white font-bold' : 'text-neutral-300'}`}>{option.name}</span>
                                        </div>
                                        <span className="text-xs text-neutral-400 font-mono">
                                            {option.price_adjustment > 0 ? `+${formatCurrency(option.price_adjustment)}` : ''}
                                        </span>

                                        <input
                                            type="checkbox" // Always check for UI, logic handled manually
                                            className="hidden"
                                            checked={isSelected}
                                            onChange={() => handleToggleOption(group.id, option.id, group.max_selection)}
                                        />
                                    </label>
                                )
                            })}
                        </div>
                    </div>
                ))}

            </div>

            {/* Footer Actions */}
            <div className="sticky bottom-0 bg-[#1a1a1a] p-4 -mx-6 -mb-6 border-t border-white/10 mt-6">
                <button
                    disabled={!isValid}
                    onClick={() => {
                        onAddToOrder(item, selectedModifiersDetails, finalPrice)
                        onClose()
                    }}
                    className={`w-full py-4 rounded-xl font-bold text-black flex justify-between px-6 transition-all ${isValid ? 'bg-amber-500 hover:bg-amber-400 transform hover:scale-[1.02]' : 'bg-neutral-700 cursor-not-allowed text-neutral-500'}`}
                >
                    <span>Agregar al Pedido</span>
                    <span>{formatCurrency(finalPrice)}</span>
                </button>
            </div>
        </Modal>
    )
}
