/**
 * Setup Script - Create Super Admin User
 * Run this once to create the initial super_admin account in Firestore
 * 
 * Usage: npx ts-node scripts/setup-admin.ts
 */

import { initializeApp, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Use environment variables for Firebase config
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
const privateKeyId = process.env.FIREBASE_PRIVATE_KEY_ID
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
const clientId = process.env.FIREBASE_CLIENT_ID

if (!projectId || !privateKeyId || !privateKey || !clientEmail || !clientId) {
  console.error('❌ Missing Firebase Admin credentials. Set these env vars:')
  console.error('  - NEXT_PUBLIC_FIREBASE_PROJECT_ID')
  console.error('  - FIREBASE_PRIVATE_KEY_ID')
  console.error('  - FIREBASE_PRIVATE_KEY')
  console.error('  - FIREBASE_CLIENT_EMAIL')
  console.error('  - FIREBASE_CLIENT_ID')
  process.exit(1)
}

const app = initializeApp({
  credential: cert({
    projectId,
    privateKeyId,
    privateKey,
    clientEmail,
    clientId,
    type: 'service_account',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
  }),
  projectId,
})

const auth = getAuth(app)
const db = getFirestore(app)

async function setupAdmin() {
  try {
    const email = 'admin@pronurse.com'
    const password = 'Admin@1234'
    const employeeCode = 'ADM001'
    const name = 'Ahmed Admin'
    const nameAr = 'أحمد الأدمن'

    console.log('🔐 Creating super_admin user...')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log(`   Employee Code: ${employeeCode}`)

    // Create Firebase Auth user
    let uid: string
    try {
      const existingUser = await auth.getUserByEmail(email)
      uid = existingUser.uid
      console.log(`✓ Firebase Auth user already exists: ${uid}`)
      // Update password
      await auth.updateUser(uid, { password })
      console.log(`✓ Password updated`)
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        const userRecord = await auth.createUser({
          email,
          password,
          displayName: name,
          emailVerified: true,
        })
        uid = userRecord.uid
        console.log(`✓ Created Firebase Auth user: ${uid}`)
      } else {
        throw err
      }
    }

    // Create Firestore user document
    const now = new Date().toISOString()
    const userData = {
      id: uid,
      name,
      nameAr,
      email,
      employeeCode,
      role: 'super_admin' as const,
      roleId: 'super_admin',
      department: 'Administration',
      departmentId: 'admin',
      status: 'active' as const,
      phone: '',
      photoURL: '',
      hireDate: now,
      lastLogin: now,
      mustChangePassword: false,
      createdAt: now,
      updatedAt: now,
      createdBy: 'SYSTEM',
      permissions: [
        'dashboard.view',
        'users.view', 'users.create', 'users.edit', 'users.delete', 'users.approve',
        'roles.view', 'roles.create', 'roles.edit', 'roles.delete',
        'departments.view', 'departments.create', 'departments.edit', 'departments.delete',
        'settings.view', 'settings.edit',
        'audit_logs.view',
        'reports.view', 'reports.create', 'reports.export',
      ],
    }

    await db.collection('users').doc(uid).set(userData, { merge: true })
    console.log(`✓ Created Firestore user document`)

    console.log('')
    console.log('✅ Super admin account created successfully!')
    console.log('')
    console.log('You can now log in with:')
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${password}`)
    console.log(`  Employee Code: ${employeeCode}`)
    console.log('')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating admin:', error)
    process.exit(1)
  }
}

setupAdmin()
