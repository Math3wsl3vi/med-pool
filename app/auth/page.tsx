'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { supabase } from '@/lib/supabase-client'
import { Heart, Mail, Lock, User, Phone, ArrowRight, Sparkles, Shield, CheckCircle2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'error' | 'success' | 'info'>('info')
  const router = useRouter()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Check if Supabase is initialized
    if (!supabase) {
      setMessageType('error')
      setMessage('Supabase is not configured. Please check your environment variables.')
      setLoading(false)
      console.error('Supabase client is null. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
      return
    }

    try {
      if (isLogin) {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) {
          console.error('Sign in error:', error)
          setMessageType('error')
          setMessage(error.message || 'Failed to sign in')
        } else if (data?.user) {
          setMessageType('success')
          setMessage('Signing in...')
          // Give user feedback before redirect
          setTimeout(() => {
            router.push('/dashboard')
          }, 500)
        }
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        })
        
        if (error) {
          console.error('Sign up error:', error)
          setMessageType('error')
          setMessage(error.message || 'Failed to create account')
        } else if (data?.user) {
          setMessageType('success')
          setMessage('Check your email for the confirmation link!')
          // Clear form
          setEmail('')
          setPassword('')
          setFullName('')
          setPhone('')
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      setMessageType('error')
      setMessage(error?.message || 'An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/4 w-96 h-96 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative min-h-screen flex">
        {/* Left Side - Branding (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <span className="text-3xl font-bold text-white">LegacyVault</span>
            </Link>
          </div>

          <div className="relative z-10 space-y-8">
            <div>
              <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
                Save for Life's Most Important Moments
              </h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Whether you're preparing for a child or securing your legacy, LegacyVault helps you save smartly with purpose.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: Shield, text: "100% Secure with multi-member approval" },
                { icon: CheckCircle2, text: "Automatic MMF investment & growth" },
                { icon: Sparkles, text: "One-time Ksh 100 subscription" }
              ].map((item, index) => (
                <div key={index} className="flex items-center space-x-3 text-white/90">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="text-lg">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 text-white/60 text-sm">
            © 2025 LegacyVault. All rights reserved.
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <Link href="/" className="flex lg:hidden items-center justify-center space-x-2 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                LegacyVault
              </span>
            </Link>

            {/* Auth Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/20">
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-indigo-100 to-purple-100 px-4 py-2 rounded-full mb-4">
                  <div className="w-2 h-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {isLogin ? 'Secure Login' : 'Create Account'}
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {isLogin ? 'Welcome back' : 'Get started'}
                </h2>
                <p className="text-gray-600">
                  {isLogin ? "Enter your credentials to access your account" : "Create your account to start saving"}
                </p>
              </div>

              {/* Form */}
              <form className="space-y-5" onSubmit={handleAuth}>
                {!isLogin && (
                  <>
                    <div className="group">
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <User className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                        <input
                          id="fullName"
                          name="fullName"
                          type="text"
                          required={!isLogin}
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>

                    <div className="group">
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                        </div>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          required={!isLogin}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                          placeholder="+254 712 345 678"
                        />
                      </div>
                    </div>
                  </>
                )}
                
                <div className="group">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                
                <div className="group">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                  {!isLogin && (
                    <p className="mt-1 text-xs text-gray-500">
                      Password must be at least 6 characters
                    </p>
                  )}
                </div>

                {message && (
                  <div className={`flex items-start space-x-3 text-sm p-4 rounded-xl border ${
                    messageType === 'error'
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : messageType === 'success'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {messageType === 'error' ? (
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    )}
                    <span className="flex-1">{message}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="group w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                >
                  <span>{loading ? 'Please wait...' : (isLogin ? 'Sign in' : 'Create account')}</span>
                  {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </Button>

                {isLogin && (
                  <div className="text-center">
                    <button
                      type="button"
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                      onClick={async () => {
                        if (email) {
                          const { error } = await supabase.auth.resetPasswordForEmail(email, {
                            redirectTo: `${window.location.origin}/auth/reset-password`
                          })
                          if (error) {
                            setMessageType('error')
                            setMessage(error.message)
                          } else {
                            setMessageType('success')
                            setMessage('Password reset email sent!')
                          }
                        } else {
                          setMessageType('error')
                          setMessage('Please enter your email address first')
                        }
                      }}
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}
              </form>

              {/* Toggle Auth Mode */}
              <div className="mt-8 text-center">
                <p className="text-gray-600 text-sm">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin)
                      setMessage('')
                      setMessageType('info')
                    }}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
              </div>
            </div>

            {/* Back to home */}
            <div className="text-center mt-6">
              <Link href="/" className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors group">
                <span className="group-hover:-translate-x-1 transition-transform">←</span>
                <span>Back to home</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}