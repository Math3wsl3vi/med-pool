'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { createClient } from '@/lib/supabase-client'
import { Heart, Plus, TrendingUp, Users, DollarSign, AlertCircle, CheckCircle, Sparkles, LogOut, Settings, Bell } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { SupabaseClient, User } from '@supabase/supabase-js'

interface Fund {
  id: string
  title: string
  description: string
  target_amount: number
  current_balance: number
  invested_balance: number
  status: string
  created_at: string
  profiles: {
    full_name: string
  }
}

interface Profile {
  id: string
  full_name: string
  phone: string
  has_subscription: boolean
}

export default function DashboardPage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [funds, setFunds] = useState<Fund[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
    } catch (error) {
      console.error('Failed to initialize Supabase:', error)
      router.push('/auth')
    }
  }, [router])

  useEffect(() => {
    if (!supabase) return

    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        
        if (error || !user) {
          router.push('/auth')
          return
        }

        setUser(user)
        await fetchProfile(user.id)
        await fetchFunds(user.id)
      } catch (error) {
        console.error('Error checking user:', error)
        router.push('/auth')
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/auth')
      } else {
        setUser(session.user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const fetchProfile = async (userId: string) => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const fetchFunds = async (userId: string) => {
    if (!supabase) return

    try {
      const { data, error } = await supabase
        .from('funds')
        .select(`
          *,
          profiles!funds_owner_id_fkey(full_name)
        `)
        .or(`owner_id.eq.${userId},fund_members.member_id.eq.${userId}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching funds:', error)
        return
      }

      setFunds(data || [])
    } catch (error) {
      console.error('Error fetching funds:', error)
    }
  }

  const handleSubscribe = async () => {
    try {
      const response = await fetch('/api/auth/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        // Redirect to Payhero checkout
        window.location.href = data.checkout_url
      } else {
        alert(data.error || 'Failed to create subscription')
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      alert('An error occurred while creating subscription')
    }
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const totalBalance = funds.reduce((sum, fund) => sum + parseFloat(String(fund.current_balance || '0')), 0)
  const totalInvested = funds.reduce((sum, fund) => sum + parseFloat(String(fund.invested_balance || '0')), 0)
  const activeFunds = funds.filter(fund => fund.status === 'active').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                LegacyVault
              </span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <span className="hidden sm:inline text-sm text-gray-600">
                Welcome, {profile.full_name || user.email?.split('@')[0]}
              </span>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <Button
                onClick={signOut}
                variant="ghost"
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subscription Check */}
        {!profile.has_subscription && (
          <div className="mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <AlertCircle className="h-6 w-6" />
                  <h3 className="text-xl font-bold">Activate Your Account</h3>
                </div>
                <p className="text-white/90 mb-4">
                  Subscribe now with a one-time payment of Ksh 100 to start creating and managing your savings goals.
                </p>
                <Button 
                  onClick={handleSubscribe}
                  className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold"
                >
                  Subscribe Now
                </Button>
              </div>
              <Sparkles className="w-12 h-12 text-white/30 hidden sm:block" />
            </div>
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard
          </h1>
          <p className="text-gray-600">Manage your purpose-driven savings goals</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Balance</p>
            <p className="text-2xl font-bold text-gray-900">Ksh {totalBalance.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Invested Amount</p>
            <p className="text-2xl font-bold text-gray-900">Ksh {totalInvested.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Active Goals</p>
            <p className="text-2xl font-bold text-gray-900">{activeFunds}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-pink-600" />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Subscription</p>
            <p className="text-2xl font-bold text-gray-900">
              {profile.has_subscription ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>

        {/* Funds Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Your Savings Goals</h2>
              {profile.has_subscription && (
                <Link href="/funds/new">
                  <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Goal
                  </Button>
                </Link>
              )}
            </div>
          </div>

          <div className="p-6">
            {funds.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-8 w-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No savings goals yet</h3>
                <p className="text-gray-600 mb-6">
                  {profile.has_subscription 
                    ? "Create your first goal to start saving with purpose"
                    : "Subscribe to start creating savings goals"
                  }
                </p>
                {profile.has_subscription ? (
                  <Link href="/funds/new">
                    <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Goal
                    </Button>
                  </Link>
                ) : (
                  <Button onClick={handleSubscribe} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                    Subscribe to Get Started
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {funds.map((fund) => (
                  <div key={fund.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-bold text-gray-900">{fund.title}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        fund.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {fund.status}
                      </span>
                    </div>
                    
                    {fund.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{fund.description}</p>
                    )}
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current Balance:</span>
                        <span className="font-semibold text-gray-900">Ksh {parseFloat(String(fund.current_balance || '0')).toLocaleString()}</span>
                      </div>
                      {fund.target_amount && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Target:</span>
                          <span className="font-semibold text-gray-900">Ksh {parseFloat(String(fund.target_amount || '0')).toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Invested:</span>
                        <span className="font-semibold text-gray-900">Ksh {parseFloat(String(fund.invested_balance || '0')).toLocaleString()}</span>
                      </div>
                    </div>

                    {fund.target_amount && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-2">
                          <span>Progress</span>
                          <span className="font-semibold">{Math.round((parseFloat(String(fund.current_balance || '0')) / parseFloat(String(fund.target_amount || '1'))) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2.5 rounded-full transition-all duration-300" 
                            style={{ 
                              width: `${Math.min((parseFloat(String(fund.current_balance || '0')) / parseFloat(String(fund.target_amount || '1'))) * 100, 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    <Link href={`/funds/${fund.id}`} className="block">
                      <Button variant="outline" size="sm" className="w-full hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-300 transition-all">
                        View Details
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}