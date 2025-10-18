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

    // TODO: Add admin role check
    // For now, we'll allow any authenticated user to view revenue data
    // In production, you should implement proper admin role checking

    // Get revenue summary
    const { data: revenue, error: revenueError } = await supabase
      .from('revenue')
      .select('*')
      .order('created_at', { ascending: false })

    if (revenueError) {
      console.error('Error fetching revenue:', revenueError)
      return NextResponse.json({ error: 'Failed to fetch revenue data' }, { status: 500 })
    }

    // Calculate totals
    const totalRevenue = revenue.reduce((sum, item) => sum + parseFloat(item.amount), 0)
    const subscriptionRevenue = revenue
      .filter(item => item.source === 'subscription')
      .reduce((sum, item) => sum + parseFloat(item.amount), 0)
    const mmfFeeRevenue = revenue
      .filter(item => item.source === 'MMF Fee')
      .reduce((sum, item) => sum + parseFloat(item.amount), 0)

    // Get platform statistics
    const { data: funds } = await supabase
      .from('funds')
      .select('id, current_balance, invested_balance, status')

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, has_subscription')

    const { data: contributions } = await supabase
      .from('contributions')
      .select('amount, status')

    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('amount, status')

    // Calculate statistics
    const activeFunds = funds?.filter(fund => fund.status === 'active').length || 0
    const totalFunds = funds?.length || 0
    const totalInvested = funds?.reduce((sum, fund) => sum + parseFloat(fund.invested_balance), 0) || 0
    const totalBalance = funds?.reduce((sum, fund) => sum + parseFloat(fund.current_balance), 0) || 0
    const subscribedUsers = profiles?.filter(profile => profile.has_subscription).length || 0
    const totalUsers = profiles?.length || 0
    const totalContributions = contributions?.filter(c => c.status === 'completed')
      .reduce((sum, c) => sum + parseFloat(c.amount), 0) || 0
    const totalWithdrawals = withdrawals?.filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + parseFloat(w.amount), 0) || 0

    const summary = {
      revenue: {
        total: totalRevenue,
        subscriptions: subscriptionRevenue,
        mmf_fees: mmfFeeRevenue,
        breakdown: revenue
      },
      platform: {
        total_users: totalUsers,
        subscribed_users: subscribedUsers,
        subscription_rate: totalUsers > 0 ? (subscribedUsers / totalUsers * 100).toFixed(2) : 0,
        total_funds: totalFunds,
        active_funds: activeFunds,
        total_invested: totalInvested,
        total_balance: totalBalance,
        total_contributions: totalContributions,
        total_withdrawals: totalWithdrawals
      }
    }

    return NextResponse.json({ summary })

  } catch (error) {
    console.error('Admin revenue error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

