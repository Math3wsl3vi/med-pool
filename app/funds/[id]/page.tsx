'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { supabase } from '@/lib/supabase'
import { Heart, ArrowLeft, Plus, TrendingUp, Users, DollarSign, Calendar, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Fund {
  id: string
  title: string
  description: string
  target_amount: number
  current_balance: number
  invested_balance: number
  status: string
  start_date: string
  end_date: string
  created_at: string
  profiles: {
    full_name: string
  }
  fund_members: Array<{
    id: string
    role: string
    approved: boolean
    profiles: {
      full_name: string
    }
  }>
  contributions: Array<{
    id: string
    amount: number
    status: string
    created_at: string
    completed_at: string
    profiles: {
      full_name: string
    }
  }>
  withdrawals: Array<{
    id: string
    amount: number
    reason: string
    status: string
    created_at: string
    completed_at: string
    profiles: {
      full_name: string
    }
  }>
  mmf_profits: Array<{
    id: string
    profit_amount: number
    platform_fee: number
    net_profit: number
    period_start: string
    period_end: string
    created_at: string
  }>
}

export default function FundDetailsPage({ params }: { params: { id: string } }) {
  const [user, setUser] = useState<any>(null)
  const [fund, setFund] = useState<Fund | null>(null)
  const [loading, setLoading] = useState(true)
  const [contributing, setContributing] = useState(false)
  const [contributionAmount, setContributionAmount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [withdrawalReason, setWithdrawalReason] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [params.id])

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/auth')
        return
      }

      setUser(user)
      await fetchFund()
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  const fetchFund = async () => {
    try {
      const response = await fetch(`/api/funds/${params.id}`)
      const data = await response.json()

      if (response.ok) {
        setFund(data.fund)
      } else {
        alert(data.error || 'Failed to fetch fund details')
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching fund:', error)
      alert('An error occurred while fetching fund details')
      router.push('/dashboard')
    }
  }

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) return

    setContributing(true)
    try {
      const response = await fetch(`/api/funds/${params.id}/contribute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(contributionAmount)
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to Payhero checkout
        window.location.href = data.checkout_url
      } else {
        alert(data.error || 'Failed to create contribution')
      }
    } catch (error) {
      console.error('Error creating contribution:', error)
      alert('An error occurred while creating contribution')
    } finally {
      setContributing(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) return

    setWithdrawing(true)
    try {
      const response = await fetch(`/api/funds/${params.id}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(withdrawalAmount),
          reason: withdrawalReason
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert('Withdrawal request created. All fund members will be notified for approval.')
        setWithdrawalAmount('')
        setWithdrawalReason('')
        await fetchFund() // Refresh fund data
      } else {
        alert(data.error || 'Failed to create withdrawal request')
      }
    } catch (error) {
      console.error('Error creating withdrawal:', error)
      alert('An error occurred while creating withdrawal request')
    } finally {
      setWithdrawing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !fund) {
    return null
  }

  const progressPercentage = fund.target_amount 
    ? Math.round((parseFloat(fund.current_balance) / parseFloat(fund.target_amount)) * 100)
    : 0

  const isOwner = fund.profiles?.id === user.id
  const isMember = fund.fund_members.some(member => member.profiles?.id === user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">MedPool</span>
            </div>
            <Link href="/dashboard">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Fund Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{fund.title}</h1>
              {fund.description && (
                <p className="text-gray-600 mb-4">{fund.description}</p>
              )}
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>Created by {fund.profiles?.full_name}</span>
                <span>•</span>
                <span>Created {new Date(fund.created_at).toLocaleDateString()}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  fund.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {fund.status}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {fund.target_amount && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress towards goal</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Ksh {parseFloat(fund.current_balance).toLocaleString()}</span>
                <span>Ksh {parseFloat(fund.target_amount).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Current Balance</p>
                    <p className="text-2xl font-bold text-gray-900">Ksh {parseFloat(fund.current_balance).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Invested Amount</p>
                    <p className="text-2xl font-bold text-gray-900">Ksh {parseFloat(fund.invested_balance).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Members</p>
                    <p className="text-2xl font-bold text-gray-900">{fund.fund_members.length + 1}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Actions</h2>
              <div className="space-y-4">
                {/* Contribute */}
                <form onSubmit={handleContribute} className="flex space-x-3">
                  <input
                    type="number"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    placeholder="Amount to contribute"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="1"
                    required
                  />
                  <Button type="submit" disabled={contributing}>
                    {contributing ? 'Processing...' : 'Contribute'}
                  </Button>
                </form>

                {/* Withdraw */}
                <form onSubmit={handleWithdraw} className="space-y-3">
                  <div className="flex space-x-3">
                    <input
                      type="number"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      placeholder="Amount to withdraw"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                      max={fund.current_balance}
                      required
                    />
                    <Button type="submit" disabled={withdrawing || parseFloat(withdrawalAmount) > parseFloat(fund.current_balance)}>
                      {withdrawing ? 'Processing...' : 'Request Withdrawal'}
                    </Button>
                  </div>
                  <input
                    type="text"
                    value={withdrawalReason}
                    onChange={(e) => setWithdrawalReason(e.target.value)}
                    placeholder="Reason for withdrawal (optional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </form>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h2>
              <div className="space-y-4">
                {fund.contributions.slice(0, 5).map((contribution) => (
                  <div key={contribution.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Contribution</p>
                      <p className="text-sm text-gray-600">by {contribution.profiles?.full_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">+Ksh {parseFloat(contribution.amount).toLocaleString()}</p>
                      <p className="text-sm text-gray-600">{new Date(contribution.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {fund.contributions.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No contributions yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Fund Members */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Fund Members</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{fund.profiles?.full_name}</p>
                    <p className="text-sm text-gray-600">Owner</p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    Owner
                  </span>
                </div>
                {fund.fund_members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{member.profiles?.full_name}</p>
                      <p className="text-sm text-gray-600">{member.role}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      member.approved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {member.approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* MMF Profits */}
            {fund.mmf_profits.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Investment Profits</h2>
                <div className="space-y-3">
                  {fund.mmf_profits.slice(0, 3).map((profit) => (
                    <div key={profit.id} className="p-3 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-green-800">+Ksh {parseFloat(profit.net_profit).toLocaleString()}</p>
                          <p className="text-sm text-green-600">
                            {new Date(profit.period_start).toLocaleDateString()} - {new Date(profit.period_end).toLocaleDateString()}
                          </p>
                        </div>
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fund Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Fund Information</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Date:</span>
                  <span className="font-medium">{new Date(fund.start_date).toLocaleDateString()}</span>
                </div>
                {fund.end_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target End Date:</span>
                    <span className="font-medium">{new Date(fund.end_date).toLocaleDateString()}</span>
                  </div>
                )}
                {fund.monthly_pledge && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Pledge:</span>
                    <span className="font-medium">Ksh {parseFloat(fund.monthly_pledge).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

