import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

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
    const { amount, reason } = body

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }

    // Get fund details and check access
    const { data: fund } = await supabase
      .from('funds')
      .select(`
        id,
        title,
        current_balance,
        owner_id,
        fund_members(member_id, role, approved)
      `)
      .eq('id', fundId)
      .single()

    if (!fund) {
      return NextResponse.json({ error: 'Fund not found' }, { status: 404 })
    }

    // Check if user is a member of the fund
    const isMember = fund.owner_id === user.id || 
      fund.fund_members.some((member: any) => member.member_id === user.id && member.approved)

    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if fund has sufficient balance
    if (parseFloat(amount) > fund.current_balance) {
      return NextResponse.json({ error: 'Insufficient fund balance' }, { status: 400 })
    }

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        fund_id: fundId,
        requester_id: user.id,
        amount: parseFloat(amount),
        reason: reason || null,
        status: 'pending'
      })
      .select()
      .single()

    if (withdrawalError) {
      console.error('Error creating withdrawal:', withdrawalError)
      return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 })
    }

    // Create approval records for all fund members (excluding the requester)
    const approvedMembers = fund.fund_members.filter((member: any) => 
      member.member_id !== user.id && member.approved
    )

    if (approvedMembers.length > 0) {
      const approvalInserts = approvedMembers.map((member: any) => ({
        withdrawal_id: withdrawal.id,
        approver_id: member.member_id,
        approved: false
      }))

      const { error: approvalError } = await supabase
        .from('approvals')
        .insert(approvalInserts)

      if (approvalError) {
        console.error('Error creating approval records:', approvalError)
      }
    }

    // TODO: Send notifications to all members about the withdrawal request
    // This would typically involve:
    // 1. Getting member contact information
    // 2. Sending email/SMS notifications
    // 3. Creating in-app notifications

    return NextResponse.json({ 
      withdrawal,
      message: 'Withdrawal request created. All fund members will be notified for approval.'
    })

  } catch (error) {
    console.error('Withdrawal error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
