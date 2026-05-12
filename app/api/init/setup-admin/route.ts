import { NextRequest, NextResponse } from 'next/server'
import { getFirebaseAuth } from '@/lib/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { createDocumentWithId } from '@/lib/firebase-services'

/**
 * API Route - Initialize Admin Account
 * POST /api/init/setup-admin
 * 
 * Creates the initial super_admin account if it doesn't exist
 * This endpoint should be called once during initial deployment
 */

export async function POST(req: NextRequest) {
  try {
    // Verify this is being called from authorized source
    const authHeader = req.headers.get('authorization')
    const setupToken = process.env.SETUP_TOKEN

    if (!setupToken || authHeader !== `Bearer ${setupToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid setup token' },
        { status: 401 }
      )
    }

    const auth = getFirebaseAuth()
    const email = 'admin@pronurse.com'
    const password = 'Admin@1234'
    const employeeCode = 'ADM001'
    const name = 'Ahmed Admin'
    const nameAr = 'أحمد الأدمن'

    try {
      // Try to create the user
      const result = await createUserWithEmailAndPassword(auth, email, password)
      const uid = result.user.uid

      // Create Firestore document
      const now = new Date().toISOString()
      await createDocumentWithId('users', uid, {
        name,
        nameAr,
        email,
        employeeCode,
        role: 'super_admin',
        roleId: 'super_admin',
        department: 'Administration',
        departmentId: 'admin',
        status: 'active',
        phone: '',
        photoURL: '',
        hireDate: now,
        lastLogin: now,
        mustChangePassword: false,
        createdAt: now,
        updatedAt: now,
        createdBy: 'SYSTEM',
      })

      return NextResponse.json({
        success: true,
        message: 'Super admin account created',
        uid,
      })
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        return NextResponse.json({
          success: true,
          message: 'Admin account already exists',
        })
      }
      throw err
    }
  } catch (error: any) {
    console.error('[SETUP ERROR]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to setup admin account' },
      { status: 500 }
    )
  }
}
