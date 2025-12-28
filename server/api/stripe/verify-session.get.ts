import { useStripeClient } from '~/server/utils/stripeInstance'
import { serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const sessionId = query.session_id as string

  if (!sessionId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Session ID is required'
    })
  }

  const stripe = useStripeClient()

  try {
    // Retrieve the Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Session not found'
      })
    }

    // Verify payment status
    if (session.payment_status !== 'paid') {
      return {
        success: false,
        status: session.payment_status,
        message: 'Payment not completed'
      }
    }

    // Get order details from metadata
    const orderId = session.metadata?.order_id
    const orderNumber = session.metadata?.order_number

    if (!orderId) {
      return {
        success: true,
        status: 'paid',
        orderNumber: null,
        message: 'Payment successful but order not found'
      }
    }

    // Use service role client to bypass RLS - webhook already confirmed payment
    const client = await serverSupabaseServiceRole<Database>(event)

    // Fetch order from database
    const { data: order } = await client
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    return {
      success: true,
      status: 'paid',
      orderNumber: order?.order_number || orderNumber,
      total: order?.total,
      orderId: order?.id
    }

  } catch (error: any) {
    console.error('Session verification error:', error.message)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to verify session'
    })
  }
})
