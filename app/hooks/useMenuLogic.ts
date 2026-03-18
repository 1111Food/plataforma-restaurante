import { useCallback } from 'react';

type MenuItem = {
    id: string;
    // ... minimal set of fields needed for logic
    [key: string]: any;
};

type CartItem = {
    id: string; // The cart item unique ID (e.g. timestamped)
    productId: string; // The menu item ID
    quantity: number;
    [key: string]: any;
};

export const useMenuLogic = (
    cartItems: CartItem[],
    addToCartAction: (item: MenuItem) => void,
    removeOneAction: (cartItemId: string) => void
) => {

    const getQty = useCallback((productId: string) => {
        return cartItems
            .filter(i => i.productId === productId || i.id === productId)
            .reduce((acc, item) => acc + item.quantity, 0);
    }, [cartItems]);

    const handleAdd = useCallback((item: MenuItem) => {
        addToCartAction(item);
    }, [addToCartAction]);

    const handleRemove = useCallback((productId: string) => {
        // Find cart items matching this product
        const matches = cartItems.filter(i => i.productId === productId || i.id === productId);
        if (matches.length > 0) {
            // Remove the last added instance (LIFO-ish to feel natural)
            const target = matches[matches.length - 1];
            removeOneAction(target.id);
        }
    }, [cartItems, removeOneAction]);

    return {
        getQty,
        handleAdd,
        handleRemove
    };
};
