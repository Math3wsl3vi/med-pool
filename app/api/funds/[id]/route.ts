import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(
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

    // Get fund details with members and recent transactions
    const { data: fund, error: fundError } = await supabase
      .from('funds')
      .select(`
        *,
        profiles!funds_owner_id_fkey(full_name, phone),
        fund_members(
          id,
          role,
          approved,
          invited_at,
          approved_at,
          profiles(full_name, phone)
        ),
        contributions(
          id,
          amount,
          status,
          created_at,
          completed_at,
          profiles(full_name)
        ),
        withdrawals(
          id,
          amount,
          reason,
          status,
          created_at,
          completed_at,
          profiles(full_name)
        ),
        mmf_profits(
          id,
          profit_amount,
          platform_fee,
          net_profit,
          period_start,
          period_end,
          created_at
        )
      `)
      .eq('id', fundId)
      .single()

    if (fundError) {
      console.error('Error fetching fund:', fundError)
      return NextResponse.json({ error: 'Fund not found' }, { status: 404 })
    }

    // Check if user has access to this fund
    const hasAccess = fund.owner_id === user.id || 
      fund.fund_members.some((member: any) => member.profiles?.id === user.id)

    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({ fund })

  } catch (error) {
    console.error('Fund fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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

    // Check if user is the fund owner
    const { data: fund } = await supabase
      .from('funds')
      .select('owner_id')
      .eq('id', fundId)
      .single()

    if (!fund || fund.owner_id !== user.id) {
      return NextResponse.json({ error: 'Only fund owners can update funds' }, { status: 403 })
    }

    // Update the fund
    const { data: updatedFund, error: updateError } = await supabase
      .from('funds')
      .update({
        title: body.title,
        description: body.description,
        target_amount: body.target_amount ? parseFloat(body.target_amount) : null,
        monthly_pledge: body.monthly_pledge ? parseFloat(body.monthly_pledge) : null,
        end_date: body.end_date || null,
        status: body.status || 'active'
      })
      .eq('id', fundId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating fund:', updateError)
      return NextResponse.json({ error: 'Failed to update fund' }, { status: 500 })
    }

    return NextResponse.json({ fund: updatedFund })

  } catch (error) {
    console.error('Fund update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

