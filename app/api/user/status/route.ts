'use server'

import { getDocument } from '@/lib/firebase-services'
import { User } from '@/types'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('id')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Fetch user from Firestore
    const user = await getDocument<User>('users', userId)

    if (!user) {
      return NextResponse.json({ status: 'unknown' }, { status: 404 })
    }

    return NextResponse.json({
      status: user.status,
      role: user.role,
      department: user.department,
      reason: user.rejectionReason || null,
    })
  } catch (error: any) {
    console.error('Error fetching user status:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}
