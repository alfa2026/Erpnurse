import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { initializeFirestore, collection, doc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const adminEmail = 'admin@pronurse.com'
const adminPassword = 'Admin@1234'

export async function POST(request: NextRequest) {
  try {
    // Initialize Firebase
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    const auth = getAuth(app)
    const db = initializeFirestore(app, {})

    // Check if admin already exists
    const adminCollection = collection(db, 'users')
    
    // Create user in Firebase Auth
    let uid = ''
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword)
      uid = userCredential.user.uid
    } catch (authError: any) {
      if (authError.code === 'auth/email-already-in-use') {
        return NextResponse.json(
          { error: 'Admin account already exists' },
          { status: 400 }
        )
      }
      throw authError
    }

    // Create user document in Firestore
    const adminDoc = {
      id: uid,
      name: 'Ahmed Admin',
      nameAr: 'أحمد الإداري',
      email: adminEmail,
      employeeCode: 'ADM001',
      role: 'super_admin',
      roleId: 'super_admin',
      status: 'active',
      department: 'الإدارة',
      departmentId: 'admin',
      phone: '+966501234567',
      hireDate: new Date().toISOString(),
      mustChangePassword: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await setDoc(doc(db, 'users', uid), adminDoc)

    // Create audit log
    await setDoc(doc(collection(db, 'auditLogs')), {
      action: 'ADMIN_SETUP',
      userId: uid,
      userEmail: adminEmail,
      details: 'System admin account created during setup',
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    })

    return NextResponse.json(
      { 
        success: true,
        message: 'Admin account created successfully',
        email: adminEmail,
        uid,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('[Admin Setup] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create admin account' },
      { status: 500 }
    )
  }
}
