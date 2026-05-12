/**
 * Admin Seed Script for PRO Nurse ERP
 * 
 * This script creates the default super_admin user in Firebase.
 * Run with: npx ts-node --esm scripts/seed-admin.ts
 * Or: node --env-file-if-exists=/vercel/share/.env.project scripts/seed-admin.js
 * 
 * Pre-configured Admin Account:
 * - Email: admin@pronurse.com
 * - Password: Admin@1234
 * - Employee Code: ADM001
 * - Role: super_admin
 */

import { initializeApp, getApps } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Admin user configuration
const ADMIN_CONFIG = {
  email: 'admin@pronurse.com',
  password: 'Admin@1234',
  employeeCode: 'ADM001',
  name: 'Ahmed Admin',
  nameAr: 'أحمد المدير',
  role: 'super_admin',
  department: 'admin',
  phone: '',
}

async function seedAdmin() {
  console.log('🏥 PRO Nurse Admin Seed Script')
  console.log('================================')
  
  // Validate config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error('❌ Firebase configuration missing. Make sure environment variables are set.')
    console.log('Required variables:')
    console.log('  - NEXT_PUBLIC_FIREBASE_API_KEY')
    console.log('  - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN')
    console.log('  - NEXT_PUBLIC_FIREBASE_PROJECT_ID')
    process.exit(1)
  }

  console.log(`📦 Connecting to Firebase project: ${firebaseConfig.projectId}`)

  // Initialize Firebase
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  const auth = getAuth(app)
  const db = getFirestore(app)

  try {
    // Check if admin already exists in Firestore
    console.log('🔍 Checking if admin user already exists...')
    
    // Try to sign in first (to see if user exists)
    let userId: string
    
    try {
      const signInResult = await signInWithEmailAndPassword(auth, ADMIN_CONFIG.email, ADMIN_CONFIG.password)
      userId = signInResult.user.uid
      console.log('✅ Admin user already exists in Firebase Auth')
    } catch {
      // User doesn't exist, create new one
      console.log('📝 Creating admin user in Firebase Auth...')
      const createResult = await createUserWithEmailAndPassword(auth, ADMIN_CONFIG.email, ADMIN_CONFIG.password)
      userId = createResult.user.uid
      console.log('✅ Admin user created in Firebase Auth')
    }

    // Create or update Firestore document
    console.log('📄 Creating/updating admin document in Firestore...')
    
    const userRef = doc(db, 'users', userId)
    const existingDoc = await getDoc(userRef)

    const userData = {
      id: userId,
      email: ADMIN_CONFIG.email,
      name: ADMIN_CONFIG.name,
      nameAr: ADMIN_CONFIG.nameAr,
      employeeCode: ADMIN_CONFIG.employeeCode,
      role: ADMIN_CONFIG.role,
      roleId: 'super_admin',
      department: ADMIN_CONFIG.department,
      departmentId: 'admin',
      status: 'active',
      phone: ADMIN_CONFIG.phone,
      hireDate: new Date().toISOString().split('T')[0],
      mustChangePassword: false,
      permissions: ['*'], // Full access
      createdAt: existingDoc.exists() ? existingDoc.data().createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await setDoc(userRef, userData, { merge: true })
    console.log('✅ Admin document created/updated in Firestore')

    // Create audit log
    const auditRef = doc(db, 'auditLogs', `seed-admin-${Date.now()}`)
    await setDoc(auditRef, {
      action: 'ADMIN_SEED',
      userId: userId,
      details: 'Admin user seeded via script',
      timestamp: new Date().toISOString(),
    })

    console.log('')
    console.log('================================')
    console.log('🎉 Admin user setup complete!')
    console.log('')
    console.log('📋 Login Credentials:')
    console.log(`   Email:         ${ADMIN_CONFIG.email}`)
    console.log(`   Password:      ${ADMIN_CONFIG.password}`)
    console.log(`   Employee Code: ${ADMIN_CONFIG.employeeCode}`)
    console.log(`   Role:          ${ADMIN_CONFIG.role}`)
    console.log('')
    console.log('🔗 You can now login at your deployed URL')
    console.log('================================')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding admin:', error)
    process.exit(1)
  }
}

// Run the script
seedAdmin()
