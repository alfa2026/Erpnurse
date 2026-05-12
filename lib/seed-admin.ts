'use client'

import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { getFirebaseAuth, getFirestoreDb, isFirebaseConfigured } from './firebase'
import { COLLECTIONS } from '@/types'

// Default admin configuration
const ADMIN_CONFIG = {
  email: 'admin@pronurse.com',
  password: 'Admin@1234',
  employeeCode: 'ADM001',
  name: 'Ahmed Admin',
  nameAr: 'أحمد المدير',
  role: 'super_admin',
  department: 'admin',
}

let hasCheckedAdmin = false

/**
 * Check if admin exists and create if not
 * This runs once on app initialization
 */
export async function ensureAdminExists(): Promise<boolean> {
  // Only run once per session
  if (hasCheckedAdmin) return true
  hasCheckedAdmin = true

  if (!isFirebaseConfigured()) {
    console.log('[AdminInit] Firebase not configured, skipping admin check')
    return false
  }

  try {
    const auth = getFirebaseAuth()
    const db = getFirestoreDb()

    // Try to sign in to check if admin exists
    let userId: string | null = null

    try {
      const result = await signInWithEmailAndPassword(auth, ADMIN_CONFIG.email, ADMIN_CONFIG.password)
      userId = result.user.uid
      console.log('[AdminInit] Admin user exists')
      
      // Sign out immediately - we were just checking
      await auth.signOut()
    } catch (signInError: unknown) {
      // Check if the error is because user doesn't exist
      const error = signInError as { code?: string }
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        console.log('[AdminInit] Admin user not found, creating...')
        
        try {
          const createResult = await createUserWithEmailAndPassword(auth, ADMIN_CONFIG.email, ADMIN_CONFIG.password)
          userId = createResult.user.uid
          console.log('[AdminInit] Admin user created in Firebase Auth')
          
          // Sign out immediately after creation
          await auth.signOut()
        } catch (createError: unknown) {
          const cError = createError as { code?: string }
          // If user already exists (race condition), that's fine
          if (cError.code === 'auth/email-already-in-use') {
            console.log('[AdminInit] Admin already exists (concurrent creation)')
            // Try to get the user by signing in again
            try {
              const retryResult = await signInWithEmailAndPassword(auth, ADMIN_CONFIG.email, ADMIN_CONFIG.password)
              userId = retryResult.user.uid
              await auth.signOut()
            } catch {
              console.log('[AdminInit] Could not verify admin user')
              return false
            }
          } else {
            console.error('[AdminInit] Error creating admin:', createError)
            return false
          }
        }
      } else {
        // Other sign-in error (wrong password, etc.)
        console.log('[AdminInit] Admin exists but could not verify')
        return true // Admin exists, just couldn't verify
      }
    }

    // Create or update Firestore document
    if (userId) {
      const userRef = doc(db, COLLECTIONS.USERS, userId)
      const existingDoc = await getDoc(userRef)

      if (!existingDoc.exists()) {
        console.log('[AdminInit] Creating admin Firestore document...')
        
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
          phone: '',
          hireDate: new Date().toISOString().split('T')[0],
          mustChangePassword: false,
          permissions: ['*'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        await setDoc(userRef, userData)
        console.log('[AdminInit] Admin Firestore document created')
      } else {
        // Make sure existing admin is active
        const existingData = existingDoc.data()
        if (existingData.status !== 'active' || existingData.role !== 'super_admin') {
          console.log('[AdminInit] Updating admin status to active/super_admin')
          await setDoc(userRef, {
            status: 'active',
            role: 'super_admin',
            updatedAt: new Date().toISOString(),
          }, { merge: true })
        }
      }
    }

    return true
  } catch (error) {
    console.error('[AdminInit] Error ensuring admin exists:', error)
    return false
  }
}
