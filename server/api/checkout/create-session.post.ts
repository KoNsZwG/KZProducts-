import { serverSupabaseUser } from '#supabase/server'
import { useStripeClient } from '~/server/utils/stripeInstance'

export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const user = await serverSupabaseUser(event)
    const stripe = useStripeClient()
    
    // Validate body.items, body.shipping
    const line_items = body.items.map((item: any) => ({
        price_data: {
            currency: 'eur',
            product_data: {
                name: item.product.name,
                images: item.product.images,
            },
            unit_amount: Math.round(item.product.price * 100),
        },
        quantity: item.quantity,
    }))

    const baseUrl = getRequestURL(event).origin

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items,
        mode: 'payment',
        success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/cart`,
        customer_email: user?.email,
        metadata: {
            user_id: user?.id || null,
        }
    })

    return { url: session.url }
})
