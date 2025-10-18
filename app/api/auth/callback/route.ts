'use server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  if (code) {
    const supabase = await createServerSupabaseClient()
    
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      // Redirect to auth page with error
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
      )
    }

    // Get the user to create their profile if it doesn't exist
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // Create profile if it doesn't exist
      if (!profile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            full_name: user.user_metadata.full_name || null,
            phone: user.user_metadata.phone || null,
            has_subscription: false
          })

        if (profileError) {
          console.error('Error creating profile:', profileError)
        }
      }
    }

    // Redirect to the next page or dashboard
    return NextResponse.redirect(new URL(next, requestUrl.origin))
  }

  // If no code, redirect to auth page
  return NextResponse.redirect(new URL('/auth', requestUrl.origin))
}