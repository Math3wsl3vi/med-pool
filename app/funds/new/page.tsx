'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { supabase } from '@/lib/supabase'
import { Heart, ArrowLeft, Plus, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Member {
  email: string
  role: string
}

export default function NewFundPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    target_amount: '',
    monthly_pledge: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: ''
  })
  const [members, setMembers] = useState<Member[]>([])
  const [newMember, setNewMember] = useState({ email: '', role: 'member' })
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

      // Check if user has subscription
      const { data: profile } = await supabase
        .from('profiles')
        .select('has_subscription')
        .eq('id', user.id)
        .single()

      if (!profile?.has_subscription) {
        router.push('/dashboard')
        return
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/auth')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const addMember = () => {
    if (newMember.email && newMember.email.includes('@')) {
      setMembers(prev => [...prev, { ...newMember }])
      setNewMember({ email: '', role: 'member' })
    }
  }

  const removeMember = (index: number) => {
    setMembers(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/funds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          members
        }),
      })

      const data = await response.json()

      if (response.ok) {
        router.push(`/funds/${data.fund.id}`)
      } else {
        alert(data.error || 'Failed to create fund')
      }
    } catch (error) {
      console.error('Error creating fund:', error)
      alert('An error occurred while creating the fund')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Fund</h1>
            <p className="text-gray-600">Set up a purpose-driven savings fund for your important life events.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Fund Details */}
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Fund Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Baby Arrival Fund, Medical Emergency Fund"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the purpose of this fund..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="target_amount" className="block text-sm font-medium text-gray-700 mb-2">
                    Target Amount (KES) *
                  </label>
                  <input
                    type="number"
                    id="target_amount"
                    name="target_amount"
                    required
                    min="1"
                    value={formData.target_amount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100000"
                  />
                </div>

                <div>
                  <label htmlFor="monthly_pledge" className="block text-sm font-medium text-gray-700 mb-2">
                    Monthly Pledge (KES)
                  </label>
                  <input
                    type="number"
                    id="monthly_pledge"
                    name="monthly_pledge"
                    min="0"
                    value={formData.monthly_pledge}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="5000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-2">
                    Target End Date
                  </label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Members Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invite Members</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add trusted family and friends who will be able to contribute and approve withdrawals.
              </p>

              <div className="space-y-4">
                {members.map((member, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{member.email}</span>
                      <span className="ml-2 text-xs text-gray-500">({member.role})</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeMember(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="flex space-x-3">
                  <input
                    type="email"
                    value={newMember.email}
                    onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter email address"
                  />
                  <select
                    value={newMember.role}
                    onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="member">Member</option>
                    <option value="co-owner">Co-owner</option>
                  </select>
                  <Button
                    type="button"
                    onClick={addMember}
                    disabled={!newMember.email || !newMember.email.includes('@')}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <Link href="/dashboard">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading || !formData.title || !formData.target_amount}
              >
                {loading ? 'Creating...' : 'Create Fund'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
