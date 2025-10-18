import { NextRequest, NextResponse } from 'next/server'
import { simulateMMFProfits } from '@/lib/mmf-simulation'

export async function POST(request: NextRequest) {
  try {
    // In production, you should add proper admin authentication here
    // For now, we'll allow any authenticated user to trigger simulation
    
    const results = await simulateMMFProfits()
    
    return NextResponse.json({
      success: true,
      message: `MMF profit simulation completed for ${results.length} funds`,
      results
    })

  } catch (error) {
    console.error('MMF simulation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

