import { serverSupabaseServiceRole } from '#supabase/server'
import { useStripeClient } from '~/server/utils/stripeInstance'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  try {
    const stripe = useStripeClient()
    const config = useRuntimeConfig()
    
    // Get raw body for signature verification - must NOT pass encoding
    // Stripe requires the raw buffer/string exactly as received
    const body = await readRawBody(event, false)
    const signature = getHeader(event, 'stripe-signature')

    if (!body || !signature) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing body or signature'
      })
    }

    const webhookSecret = config.stripeWebhookSecret
    
    if (!webhookSecret) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Webhook secret not configured'
      })
    }

    let stripeEvent

    try {
      stripeEvent = stripe.webhooks.constructEvent(body, signature, webhookSecret as string)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      throw createError({
        statusCode: 400,
        statusMessage: `Webhook Error: ${err.message}`
      })
    }

    // Use service role client for admin operations (bypasses RLS)
    const supabase = await serverSupabaseServiceRole<Database>(event)

    // Handle the event
    switch (stripeEvent.type) {
      case 'checkout.session.completed': {
        const session = stripeEvent.data.object as any
        const orderId = session.metadata?.order_id
        const orderNumber = session.metadata?.order_number
        const userId = session.metadata?.user_id

        if (!orderId) {
          return { received: true, error: 'No order_id in metadata' }
        }

        // Update order status to 'paid'
        const { error: updateError } = await supabase
          .from('orders')
          .update({ 
            status: 'paid',
            stripe_payment_intent: session.payment_intent || session.id
          })
          .eq('id', orderId)

        if (updateError) {
          console.error('Failed to update order status:', updateError)
          return { received: true, error: 'Failed to update order' }
        }

        // Clear user's cart
        if (userId) {
          await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId)
        }

        break
      }

      case 'checkout.session.expired': {
        const session = stripeEvent.data.object as any
        const orderId = session.metadata?.order_id

        if (orderId) {
          await supabase
            .from('orders')
            .update({ status: 'expired' })
            .eq('id', orderId)
        }
        break
      }

      default:
        // Unhandled event type - no action needed
        break
    }

    return { received: true }
    
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    
    // Re-throw createError exceptions
    if (error.statusCode) {
      throw error
    }
    
    // Handle unexpected errors
    throw createError({
      statusCode: 500,
      statusMessage: `Webhook processing failed: ${error.message}`
    })
  }
})
