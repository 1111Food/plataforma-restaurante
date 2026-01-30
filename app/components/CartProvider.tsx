'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type CartItem = {
    id: string      // Unique Cart ID (generated)
    productId: string // Original Product ID
    name: string
    price: number
    quantity: number
    modifiers?: {    // Selected modifiers
        id: string
        name: string
        price: number
        groupId: string
        groupName: string
    }[]
}

type CartContextType = {
    items: CartItem[]
    addToCart: (item: Omit<CartItem, 'quantity' | 'id'> & { id?: string }) => void
    removeFromCart: (itemId: string) => void
    removeOne: (itemId: string) => void
    cartTotal: number
    tableNumber: string | null
    setTableNumber: (table: string | null) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([])
    const [tableNumber, setTableNumber] = useState<string | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    // Cargar del localStorage al iniciar
    useEffect(() => {
        const savedCart = localStorage.getItem('cart')
        const savedTable = localStorage.getItem('tableNumber')
        if (savedCart) {
            setItems(JSON.parse(savedCart))
        }
        if (savedTable) {
            setTableNumber(savedTable)
        }
        setIsLoaded(true)
    }, [])

    // Guardar en localStorage cada vez que cambie
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('cart', JSON.stringify(items))
            if (tableNumber) {
                localStorage.setItem('tableNumber', tableNumber)
            } else {
                localStorage.removeItem('tableNumber')
            }
        }
    }, [items, tableNumber, isLoaded])

    const addToCart = (product: Omit<CartItem, 'quantity' | 'id'> & { id?: string }) => {
        setItems((prev) => {
            const modifiersHash = product.modifiers
                ? product.modifiers.map(m => m.id).sort().join('-')
                : '';

            const productId = product.productId || (product as any).id;
            const uniqueCartId = `${productId}-${modifiersHash || 'base'}`;

            const existing = prev.find((i) => i.id === uniqueCartId)

            if (existing) {
                return prev.map((i) =>
                    i.id === uniqueCartId ? { ...i, quantity: i.quantity + 1 } : i
                )
            }

            return [...prev, {
                ...product,
                id: uniqueCartId,
                productId: productId,
                quantity: 1,
                modifiers: product.modifiers || []
            }]
        })
    }

    const removeFromCart = (itemId: string) => {
        setItems((prev) => prev.filter((i) => i.id !== itemId))
    }

    const removeOne = (itemId: string) => {
        setItems((prev) => {
            const existing = prev.find((i) => i.id === itemId)
            if (existing && existing.quantity > 1) {
                return prev.map((i) =>
                    i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
                )
            }
            return prev.filter((i) => i.id !== itemId)
        })
    }

    const cartTotal = items.reduce((total, item) => {
        const modifiersTotal = item.modifiers ? item.modifiers.reduce((acc, mod) => acc + mod.price, 0) : 0;
        return total + (item.price + modifiersTotal) * item.quantity
    }, 0)

    return (
        <CartContext.Provider value={{ items, addToCart, removeFromCart, removeOne, cartTotal, tableNumber, setTableNumber }}>
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider')
    }
    return context
}
