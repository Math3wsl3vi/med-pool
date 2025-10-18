import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { payheroService } from '@/lib/payhero'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const signature = request.headers.get('x-payhero-signature') || ''
    const url = new URL(request.url)
    const type = url.searchParams.get('type')

    // Verify webhook signature
    if (!payheroService.verifyWebhook(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const supabase = createServerSupabaseClient()

    if (type === 'subscription') {
      return await handleSubscriptionWebhook(body, supabase)
    } else if (type === 'contribution') {
      return await handleContributionWebhook(body, supabase)
    } else if (type === 'disbursement') {
      return await handleDisbursementWebhook(body, supabase)
    }

    return NextResponse.json({ error: 'Unknown webhook type' }, { status: 400 })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function handleSubscriptionWebhook(payload: any, supabase: any) {
  const { transaction_id, status, amount } = payload

  if (status === 'success') {
    // Update subscription status
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('payhero_tx_id', transaction_id)

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError)
      return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })
    }

    // Update user profile to mark as subscribed
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('payhero_tx_id', transaction_id)
      .single()

    if (subscription) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ has_subscription: true })
        .eq('id', subscription.user_id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
      }

      // Record revenue
      await supabase
        .from('revenue')
        .insert({
          source: 'subscription',
          amount: amount,
          user_id: subscription.user_id
        })
    }
  } else {
    // Update subscription status to failed
    await supabase
      .from('subscriptions')
      .update({ status: 'failed' })
      .eq('payhero_tx_id', transaction_id)
  }

  return NextResponse.json({ success: true })
}

async function handleContributionWebhook(payload: any, supabase: any) {
  const { transaction_id, status, amount, reference } = payload

  if (status === 'success') {
    // Update contribution status
    const { error: contributionError } = await supabase
      .from('contributions')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('payhero_tx_id', transaction_id)

    if (contributionError) {
      console.error('Error updating contribution:', contributionError)
      return NextResponse.json({ error: 'Failed to update contribution' }, { status: 500 })
    }

    // Get contribution details
    const { data: contribution } = await supabase
      .from('contributions')
      .select('fund_id, amount')
      .eq('payhero_tx_id', transaction_id)
      .single()

    if (contribution) {
      // Update fund balance
      const { error: fundError } = await supabase
        .from('funds')
        .update({ 
          current_balance: supabase.raw('current_balance + ?', [contribution.amount]),
          invested_balance: supabase.raw('invested_balance + ?', [contribution.amount])
        })
        .eq('id', contribution.fund_id)

      if (fundError) {
        console.error('Error updating fund balance:', fundError)
      }
    }
  } else {
    // Update contribution status to failed
    await supabase
      .from('contributions')
      .update({ status: 'failed' })
      .eq('payhero_tx_id', transaction_id)
  }

  return NextResponse.json({ success: true })
}

async function handleDisbursementWebhook(payload: any, supabase: any) {
  const { disbursement_id, status, amount } = payload

  if (status === 'completed') {
    // Update withdrawal status
    const { error: withdrawalError } = await supabase
      .from('withdrawals')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('payhero_disbursement_id', disbursement_id)

    if (withdrawalError) {
      console.error('Error updating withdrawal:', withdrawalError)
      return NextResponse.json({ error: 'Failed to update withdrawal' }, { status: 500 })
    }

    // Get withdrawal details and update fund balance
    const { data: withdrawal } = await supabase
      .from('withdrawals')
      .select('fund_id, amount')
      .eq('payhero_disbursement_id', disbursement_id)
      .single()

    if (withdrawal) {
      // Update fund balance
      const { error: fundError } = await supabase
        .from('funds')
        .update({ 
          current_balance: supabase.raw('current_balance - ?', [withdrawal.amount]),
          invested_balance: supabase.raw('invested_balance - ?', [withdrawal.amount])
        })
        .eq('id', withdrawal.fund_id)

      if (fundError) {
        console.error('Error updating fund balance:', fundError)
      }
    }
  } else if (status === 'failed') {
    // Update withdrawal status to failed
    await supabase
      .from('withdrawals')
      .update({ status: 'failed' })
      .eq('payhero_disbursement_id', disbursement_id)
  }

  return NextResponse.json({ success: true })
}

