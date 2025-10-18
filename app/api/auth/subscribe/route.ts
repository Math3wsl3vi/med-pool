import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { payheroService } from '@/lib/payhero'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user already has a subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('has_subscription')
      .eq('id', user.id)
      .single()

    if (profile?.has_subscription) {
      return NextResponse.json({ error: 'User already has an active subscription' }, { status: 400 })
    }

    // Create Payhero checkout for Ksh 100 subscription
    const checkoutRequest = {
      amount: 5,
      currency: 'KES',
      description: 'MedPool Platform Subscription',
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payhero?type=subscription`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=cancelled`,
      metadata: {
        user_id: user.id,
        type: 'subscription'
      }
    }

    const checkoutResponse = await payheroService.createCheckout(checkoutRequest)

    // Store the subscription record
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        amount: 100,
        payhero_tx_id: checkoutResponse.transaction_id,
        status: 'pending'
      })

    if (subscriptionError) {
      console.error('Error creating subscription record:', subscriptionError)
      return NextResponse.json({ error: 'Failed to create subscription record' }, { status: 500 })
    }

    return NextResponse.json({
      checkout_url: checkoutResponse.checkout_url,
      transaction_id: checkoutResponse.transaction_id
    })

  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}