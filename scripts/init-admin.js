#!/usr/bin/env node
/**
 * scripts/init-admin.js
 * Run ONCE to create the first super-admin in Firebase.
 *
 * Steps:
 *   1. Go to Firebase Console → Project Settings → Service Accounts
 *   2. Click "Generate new private key" → save as scripts/serviceAccountKey.json
 *   3. cd scripts && npm install firebase-admin && node init-admin.js
 */

const admin = require('firebase-admin')
const path  = require('path')
const sa    = require('./serviceAccountKey.json')

admin.initializeApp({ credential: admin.credential.cert(sa) })
const db   = admin.firestore()
const auth = admin.auth()

const ADMIN = {
  email:    'admin@pronurse.com',
  password: 'Admin@1234',
  name:     'Ahmed Admin',
  nameAr:   'أحمد المدير',
  empCode:  'ADM001',
}

async function run() {
  console.log('\n🔧 PRO Nurse — First Admin Setup\n')

  // Create Auth user
  let uid
  try {
    const u = await auth.getUserByEmail(ADMIN.email)
    uid = u.uid
    console.log('✅ Auth user already exists:', uid)
  } catch {
    const u = await auth.createUser({ email: ADMIN.email, password: ADMIN.password, displayName: ADMIN.name })
    uid = u.uid
    console.log('✅ Auth user created:', uid)
  }

  // Create Firestore user doc
  await db.collection('users').doc(uid).set({
    id:                uid,
    name:              ADMIN.name,
    nameAr:            ADMIN.nameAr,
    email:             ADMIN.email,
    employeeCode:      ADMIN.empCode,
    role:              'super_admin',
    roleId:            'role-super-admin',
    department:        'Administration',
    departmentId:      'dept-admin',
    status:            'active',
    hireDate:          '2024-01-01',
    mustChangePassword: false,
    createdAt:         new Date().toISOString(),
    updatedAt:         new Date().toISOString(),
  }, { merge: true })
  console.log('✅ Firestore user document created')

  // Default role
  await db.collection('roles').doc('role-super-admin').set({
    id: 'role-super-admin', name: 'Super Admin', nameAr: 'مدير النظام',
    description: 'Full access', permissions: ['*'], isActive: true,
    isSystem: true, createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(), createdBy: uid,
  }, { merge: true })
  console.log('✅ Default role created')

  // System settings
  await db.collection('settings').doc('system').set({
    systemName: 'PRO Nurse HIS', hospitalName: 'مستشفى برو نيرس',
    initialized: true, adminEmail: ADMIN.email, createdAt: new Date().toISOString(),
  }, { merge: true })
  console.log('✅ System settings initialized')

  console.log('\n🎉 Done! Login at your Vercel URL:')
  console.log('   Email:    ' + ADMIN.email)
  console.log('   Password: ' + ADMIN.password)
  console.log('   Tab: Admin (Shield icon)')
}

run().catch(err => { console.error('❌ Error:', err.message); process.exit(1) })
