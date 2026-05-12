'use server'

import { getFirebaseAuth } from '@/lib/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const auth = getFirebaseAuth()
    
    // Send password reset email
    await sendPasswordResetEmail(auth, email, {
      url: `${request.nextUrl.origin}/login?reset=true`,
      handleCodeInApp: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Password reset email sent',
    })
  } catch (error: any) {
    console.error('Error sending reset email:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send reset email' },
      { status: 500 }
    )
  }
}
