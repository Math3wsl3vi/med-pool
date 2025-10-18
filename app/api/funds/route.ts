import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's funds (owned and member of)
    const { data: funds, error } = await supabase
      .from('funds')
      .select(`
        *,
        fund_members!inner(member_id, role, approved),
        profiles!funds_owner_id_fkey(full_name)
      `)
      .or(`owner_id.eq.${user.id},fund_members.member_id.eq.${user.id}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching funds:', error)
      return NextResponse.json({ error: 'Failed to fetch funds' }, { status: 500 })
    }

    return NextResponse.json({ funds })

  } catch (error) {
    console.error('Funds fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has subscription
    const { data: profile } = await supabase
      .from('profiles')
      .select('has_subscription')
      .eq('id', user.id)
      .single()

    if (!profile?.has_subscription) {
      return NextResponse.json({ error: 'Subscription required to create funds' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, target_amount, monthly_pledge, start_date, end_date, members } = body

    // Validate required fields
    if (!title || !target_amount) {
      return NextResponse.json({ error: 'Title and target amount are required' }, { status: 400 })
    }

    // Create the fund
    const { data: fund, error: fundError } = await supabase
      .from('funds')
      .insert({
        owner_id: user.id,
        title,
        description,
        target_amount: parseFloat(target_amount),
        monthly_pledge: monthly_pledge ? parseFloat(monthly_pledge) : null,
        start_date: start_date || new Date().toISOString().split('T')[0],
        end_date: end_date || null
      })
      .select()
      .single()

    if (fundError) {
      console.error('Error creating fund:', fundError)
      return NextResponse.json({ error: 'Failed to create fund' }, { status: 500 })
    }

    // Add fund owner as a member
    await supabase
      .from('fund_members')
      .insert({
        fund_id: fund.id,
        member_id: user.id,
        role: 'owner',
        approved: true,
        approved_at: new Date().toISOString()
      })

    // Add other members if provided
    if (members && members.length > 0) {
      const memberInserts = members.map((member: { email: string; role?: string }) => ({
        fund_id: fund.id,
        member_email: member.email,
        role: member.role || 'member',
        approved: false
      }))

      // Note: In a real implementation, you would need to:
      // 1. Look up user IDs by email
      // 2. Send invitation emails
      // 3. Handle the invitation flow
      
      // For now, we'll just log the members
      console.log('Members to invite:', memberInserts)
    }

    return NextResponse.json({ fund })

  } catch (error) {
    console.error('Fund creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
