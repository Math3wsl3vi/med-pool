'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function TestSupabasePage() {
  const [status, setStatus] = useState('Testing...')
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    testSupabaseConnection()
  }, [])

  const testSupabaseConnection = async () => {
    try {
      setStatus('Testing Supabase connection...')
      
      // Check environment variables
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (!supabaseUrl || !supabaseKey) {
        setError('Environment variables are missing!')
        setStatus('Failed')
        return
      }
      
      setStatus('Environment variables found ✓')
      
      // Test basic connection
      const { data, error: connectionError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      if (connectionError) {
        setError(`Connection failed: ${connectionError.message}`)
        setStatus('Failed')
        return
      }
      
      setStatus('Database connection successful ✓')
      
      // Check current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        setError(`User check failed: ${userError.message}`)
        setStatus('Failed')
        return
      }
      
      setUser(user)
      setStatus('All tests passed ✓')
      
    } catch (err) {
      setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setStatus('Failed')
    }
  }

  const testSignUp = async () => {
    try {
      const testEmail = `test-${Date.now()}@example.com`
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpassword123',
        options: {
          data: {
            full_name: 'Test User',
            phone: '+254700000000'
          }
        }
      })
      
      if (error) {
        setError(`Signup failed: ${error.message}`)
      } else {
        setStatus('Test signup successful ✓')
        setUser(data.user)
      }
    } catch (err) {
      setError(`Signup error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const testSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123'
      })
      
      if (error) {
        setError(`Signin failed: ${error.message}`)
      } else {
        setStatus('Test signin successful ✓')
        setUser(data.user)
      }
    } catch (err) {
      setError(`Signin error: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          <p className={`text-lg ${status.includes('✓') ? 'text-green-600' : status.includes('Failed') ? 'text-red-600' : 'text-blue-600'}`}>
            {status}
          </p>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error:</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {user && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">Current User:</p>
              <pre className="text-green-700 text-sm mt-2 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_URL:</span>{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing'}
            </p>
            <p>
              <span className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>{' '}
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing'}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
          <div className="space-x-4">
            <Button onClick={testSupabaseConnection}>
              Test Connection
            </Button>
            <Button onClick={testSignUp} variant="outline">
              Test Signup
            </Button>
            <Button onClick={testSignIn} variant="outline">
              Test Signin
            </Button>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a href="/auth" className="text-blue-600 hover:text-blue-800">
            ← Back to Auth Page
          </a>
        </div>
      </div>
    </div>
  )
}

