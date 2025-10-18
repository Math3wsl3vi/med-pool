import { createServerSupabaseClient } from './supabase'

interface MMFProfitResult {
  fund_id: string
  profit_amount: number
  platform_fee: number
  net_profit: number
}

/**
 * Simulates MMF profit calculation for all active funds
 * This would typically be run as a scheduled job (cron, Supabase Edge Function, etc.)
 */
export async function simulateMMFProfits(): Promise<MMFProfitResult[]> {
  const supabase = await createServerSupabaseClient()
  
  try {
    // Get all active funds with invested balances
    const { data: funds, error: fundsError } = await supabase
      .from('funds')
      .select('id, invested_balance, current_balance')
      .eq('status', 'active')
      .gt('invested_balance', 0)

    if (fundsError) {
      console.error('Error fetching funds for MMF simulation:', fundsError)
      return []
    }

    if (!funds || funds.length === 0) {
      console.log('No active funds with invested balances found')
      return []
    }

    const results: MMFProfitResult[] = []
    const currentDate = new Date()
    const periodStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)

    for (const fund of funds) {
      // Simulate monthly MMF return (0.5% - 1% per month)
      const monthlyReturnRate = 0.006 + (Math.random() * 0.004) // 0.6% - 1% with some randomness
      const profitAmount = parseFloat(fund.invested_balance) * monthlyReturnRate
      
      // Calculate platform fee (5% of profit)
      const platformFee = profitAmount * 0.05
      const netProfit = profitAmount - platformFee

      // Record the profit
      const { error: profitError } = await supabase
        .from('mmf_profits')
        .insert({
          fund_id: fund.id,
          profit_amount: profitAmount,
          platform_fee: platformFee,
          net_profit: netProfit,
          period_start: periodStart.toISOString().split('T')[0],
          period_end: periodEnd.toISOString().split('T')[0]
        })

      if (profitError) {
        console.error(`Error recording MMF profit for fund ${fund.id}:`, profitError)
        continue
      }

      // Update fund balances
      const { error: fundUpdateError } = await supabase
        .from('funds')
        .update({
          current_balance: parseFloat(fund.current_balance) + netProfit,
          invested_balance: parseFloat(fund.invested_balance) + netProfit
        })
        .eq('id', fund.id)

      if (fundUpdateError) {
        console.error(`Error updating fund balance for fund ${fund.id}:`, fundUpdateError)
        continue
      }

      // Record platform revenue
      const { error: revenueError } = await supabase
        .from('revenue')
        .insert({
          source: 'MMF Fee',
          amount: platformFee,
          fund_id: fund.id
        })

      if (revenueError) {
        console.error(`Error recording platform revenue for fund ${fund.id}:`, revenueError)
      }

      results.push({
        fund_id: fund.id,
        profit_amount: profitAmount,
        platform_fee: platformFee,
        net_profit: netProfit
      })

      console.log(`MMF profit processed for fund ${fund.id}: Ksh ${netProfit.toFixed(2)} (Fee: Ksh ${platformFee.toFixed(2)})`)
    }

    console.log(`MMF profit simulation completed for ${results.length} funds`)
    return results

  } catch (error) {
    console.error('Error in MMF profit simulation:', error)
    return []
  }
}

/**
 * Get MMF profit history for a specific fund
 */
export async function getFundProfitHistory(fundId: string) {
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .from('mmf_profits')
      .select('*')
      .eq('fund_id', fundId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching fund profit history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error in getFundProfitHistory:', error)
    return []
  }
}

/**
 * Calculate total MMF profits for a fund
 */
export async function getTotalFundProfits(fundId: string) {
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .from('mmf_profits')
      .select('net_profit')
      .eq('fund_id', fundId)

    if (error) {
      console.error('Error calculating total fund profits:', error)
      return 0
    }

    const totalProfits = data?.reduce((sum: number, profit: any) => sum + parseFloat(profit.net_profit), 0) || 0
    return totalProfits
  } catch (error) {
    console.error('Error in getTotalFundProfits:', error)
    return 0
  }
}

/**
 * Get platform revenue from MMF fees
 */
export async function getPlatformMMFRevenue() {
  const supabase = await createServerSupabaseClient()
  
  try {
    const { data, error } = await supabase
      .from('revenue')
      .select('amount')
      .eq('source', 'MMF Fee')

    if (error) {
      console.error('Error fetching platform MMF revenue:', error)
      return 0
    }

    const totalRevenue = data?.reduce((sum: number, revenue: any) => sum + parseFloat(revenue.amount), 0) || 0
    return totalRevenue
  } catch (error) {
    console.error('Error in getPlatformMMFRevenue:', error)
    return 0
  }
}