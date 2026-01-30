import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            cartItems,
            restaurantId,
            restaurantSlug,
            fulfillment_method,
            delivery_zone,
            delivery_address,
            pickup_time,
            customer_whatsapp,
            table_number,
            customer_name
        } = body;

        if (!cartItems || cartItems.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        // Map cart items to Stripe line items
        const line_items = cartItems.map((item: any) => {
            let name = item.name;
            if (item.selectedModifiers && item.selectedModifiers.length > 0) {
                const modifierNames = item.selectedModifiers.map((m: any) => m.name).join(', ');
                name += ` (+ ${modifierNames})`;
            }

            return {
                price_data: {
                    currency: 'gtq',
                    product_data: {
                        name: name,
                    },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity,
            };
        });

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items,
            mode: 'payment',
            success_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}&slug=${restaurantSlug}`,
            cancel_url: `${req.headers.get('origin')}/${restaurantSlug}`,
            metadata: {
                restaurantId,
                customerName: customer_name,
                fulfillmentMethod: fulfillment_method,
                // Conditionally add fields based on method to save space/noise
                ...(fulfillment_method === 'dine_in' && { tableNumber: table_number }),
                ...(fulfillment_method === 'delivery' && {
                    deliveryZone: delivery_zone,
                    deliveryAddress: delivery_address?.substring(0, 500)
                }),
                ...(fulfillment_method === 'pickup' && { pickupTime: pickup_time }),
                whatsapp: customer_whatsapp,
                orderSummary: JSON.stringify(cartItems.map((i: any) => ({ id: i.id, q: i.quantity, n: i.name }))).substring(0, 500)
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error('Stripe Error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
