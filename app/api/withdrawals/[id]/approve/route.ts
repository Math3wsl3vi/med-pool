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

    const withdrawalId = params.id
    const body = await request.json()
    const { approved } = body

    // Get withdrawal details
    const { data: withdrawal } = await supabase
      .from('withdrawals')
      .select(`
        id,
        fund_id,
        requester_id,
        amount,
        status,
        funds(
          id,
          title,
          current_balance,
          fund_members(member_id, role, approved)
        )
      `)
      .eq('id', withdrawalId)
      .single()

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 })
    }

    // Check if user is a member of the fund
    const isMember = withdrawal.funds.fund_members.some((member: any) => 
      member.member_id === user.id && member.approved
    )

    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if withdrawal is still pending
    if (withdrawal.status !== 'pending') {
      return NextResponse.json({ error: 'Withdrawal is no longer pending' }, { status: 400 })
    }

    // Update the approval
    const { error: approvalError } = await supabase
      .from('approvals')
      .update({ 
        approved: approved,
        approved_at: approved ? new Date().toISOString() : null
      })
      .eq('withdrawal_id', withdrawalId)
      .eq('approver_id', user.id)

    if (approvalError) {
      console.error('Error updating approval:', approvalError)
      return NextResponse.json({ error: 'Failed to update approval' }, { status: 500 })
    }

    // If approved, check if all members have approved
    if (approved) {
      const { data: approvals } = await supabase
        .from('approvals')
        .select('approved')
        .eq('withdrawal_id', withdrawalId)

      const allApproved = approvals?.every((approval: any) => approval.approved)

      if (allApproved) {
        // All members have approved, process the withdrawal
        await processWithdrawal(withdrawalId, supabase)
      }
    } else {
      // If any member rejects, mark withdrawal as rejected
      const { error: withdrawalError } = await supabase
        .from('withdrawals')
        .update({ status: 'rejected' })
        .eq('id', withdrawalId)

      if (withdrawalError) {
        console.error('Error updating withdrawal status:', withdrawalError)
      }
    }

    return NextResponse.json({ 
      success: true,
      message: approved ? 'Approval recorded' : 'Rejection recorded'
    })

  } catch (error) {
    console.error('Approval error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function processWithdrawal(withdrawalId: string, supabase: any) {
  try {
    // Get withdrawal details
    const { data: withdrawal } = await supabase
      .from('withdrawals')
      .select(`
        id,
        fund_id,
        requester_id,
        amount,
        funds(title)
      `)
      .eq('id', withdrawalId)
      .single()

    if (!withdrawal) {
      throw new Error('Withdrawal not found')
    }

    // Get user details for disbursement
    const { data: user } = await supabase
      .from('profiles')
      .select('full_name, phone')
      .eq('id', withdrawal.requester_id)
      .single()

    // Update withdrawal status to approved
    await supabase
      .from('withdrawals')
      .update({ status: 'approved' })
      .eq('id', withdrawalId)

    // Create Payhero disbursement
    const disbursementRequest = {
      amount: withdrawal.amount,
      account_number: user.phone || '1234567890', // In real implementation, get from user profile
      account_name: user.full_name || 'User',
      bank_code: '01', // In real implementation, get from user profile
      description: `Withdrawal from ${withdrawal.funds.title}`,
      reference: `WD_${withdrawalId}`
    }

    const disbursementResponse = await payheroService.disburse(disbursementRequest)

    // Update withdrawal with disbursement ID
    await supabase
      .from('withdrawals')
      .update({ 
        payhero_disbursement_id: disbursementResponse.disbursement_id,
        status: 'processing'
      })
      .eq('id', withdrawalId)

    // TODO: Send notification to requester about successful withdrawal processing

  } catch (error) {
    console.error('Error processing withdrawal:', error)
    
    // Mark withdrawal as failed
    await supabase
      .from('withdrawals')
      .update({ status: 'failed' })
      .eq('id', withdrawalId)
  }
}

