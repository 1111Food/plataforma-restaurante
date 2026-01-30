'use client'

import { X } from 'lucide-react'
import { useEffect } from 'react'

type ModalProps = {
    isOpen: boolean
    onClose: () => void
    title: string
    children: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-neutral-900 border border-white/10 w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/5 bg-neutral-950">
                    <h3 className="font-bold text-lg text-white">{title}</h3>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white transition">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[80vh]">
                    {children}
                </div>
            </div>
        </div>
    )
}
