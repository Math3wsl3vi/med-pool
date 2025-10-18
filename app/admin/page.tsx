'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { supabase } from '@/lib/supabase'
import { Heart, ArrowLeft, TrendingUp, Users, DollarSign, Activity, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface RevenueSummary {
  revenue: {
    total: number
    subscriptions: number
    mmf_fees: number
    breakdown: Array<{
      id: string
      source: string
      amount: number
      created_at: string
    }>
  }
  platform: {
    total_users: number
    subscribed_users: number
    subscription_rate: string
    total_funds: number
    active_funds: number
    total_invested: number
    total_balance: number
    total_contributions: number
    total_withdrawals: number
  }
}

export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [summary, setSummary] = useState<RevenueSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/auth')
        return
      }

      setUser(user)
      await fetchSummary()
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/auth')
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const response = await fetch('/api/admin/revenue')
      const data = await response.json()

      if (response.ok) {
        setSummary(data.summary)
      } else {
        console.error('Error fetching summary:', data.error)
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }

  const simulateMMF = async () => {
    setSimulating(true)
    try {
      const response = await fetch('/api/admin/simulate-mmf', {
        method: 'POST'
      })
      const data = await response.json()

      if (response.ok) {
        alert(`MMF simulation completed: ${data.message}`)
        await fetchSummary() // Refresh data
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      console.error('Error simulating MMF:', error)
      alert('An error occurred while simulating MMF profits')
    } finally {
      setSimulating(false)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">MedPool Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <Button variant="ghost" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Platform revenue and insights</p>
        </div>

        {/* Actions */}
        <div className="mb-8">
          <div className="flex space-x-4">
            <Button onClick={simulateMMF} disabled={simulating}>
              {simulating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4 mr-2" />
                  Simulate MMF Profits
                </>
              )}
            </Button>
            <Button variant="outline" onClick={fetchSummary}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {summary && (
          <>
            {/* Revenue Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">Ksh {summary.revenue.total.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Subscriptions</p>
                    <p className="text-2xl font-bold text-gray-900">Ksh {summary.revenue.subscriptions.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">MMF Fees</p>
                    <p className="text-2xl font-bold text-gray-900">Ksh {summary.revenue.mmf_fees.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Activity className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Subscription Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{summary.platform.subscription_rate}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.platform.total_users}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Subscribed Users</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.platform.subscribed_users}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Total Funds</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.platform.total_funds}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Active Funds</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.platform.active_funds}</p>
                </div>
              </div>
            </div>

            {/* Financial Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Total Invested</p>
                  <p className="text-2xl font-bold text-gray-900">Ksh {summary.platform.total_invested.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Total Balance</p>
                  <p className="text-2xl font-bold text-gray-900">Ksh {summary.platform.total_balance.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-600">Net Contributions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    Ksh {(summary.platform.total_contributions - summary.platform.total_withdrawals).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Revenue */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Revenue</h2>
              <div className="space-y-3">
                {summary.revenue.breakdown.slice(0, 10).map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.source}</p>
                      <p className="text-sm text-gray-600">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">+Ksh {parseFloat(item.amount).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {summary.revenue.breakdown.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No revenue data yet</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

