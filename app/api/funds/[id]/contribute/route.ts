import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { payheroService } from '@/lib/payhero'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fundId = params.id
    const body = await request.json()
    const { amount } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    // Check if user has access to this fund
    const { data: fund } = await supabase
      .from('funds')
      .select(`
        id,
        title,
        owner_id,
        fund_members(member_id)
      `)
      .eq('id', fundId)
      .single()

    if (!fund) {
      return NextResponse.json({ error: 'Fund not found' }, { status: 404 })
    }

    const hasAccess = fund.owner_id === user.id || 
      fund.fund_members.some((member: any) => member.member_id === user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Create contribution record
    const { data: contribution, error: contributionError } = await supabase
      .from('contributions')
      .insert({
        fund_id: fundId,
        user_id: user.id,
        amount: parseFloat(amount),
        status: 'pending'
      })
      .select()
      .single()

    if (contributionError) {
      console.error('Error creating contribution:', contributionError)
      return NextResponse.json({ error: 'Failed to create contribution' }, { status: 500 })
    }

    // Create Payhero checkout
    const checkoutRequest = {
      amount: parseFloat(amount),
      currency: 'KES',
      description: `Contribution to ${fund.title}`,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/payhero?type=contribution`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/funds/${fundId}?contribution=cancelled`,
      metadata: {
        contribution_id: contribution.id,
        fund_id: fundId,
        user_id: user.id,
        type: 'contribution'
      }
    }

    const checkoutResponse = await payheroService.createCheckout(checkoutRequest)

    // Update contribution with Payhero transaction ID
    const { error: updateError } = await supabase
      .from('contributions')
      .update({ payhero_tx_id: checkoutResponse.transaction_id })
      .eq('id', contribution.id)

    if (updateError) {
      console.error('Error updating contribution with Payhero ID:', updateError)
    }

    return NextResponse.json({
      checkout_url: checkoutResponse.checkout_url,
      transaction_id: checkoutResponse.transaction_id,
      contribution_id: contribution.id
    })

  } catch (error) {
    console.error('Contribution error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
