'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, limit } from 'firebase/firestore'
import { getFirebaseAuth, getFirestoreDb, isFirebaseConfigured } from '@/lib/firebase'
import { ensureAdminExists } from '@/lib/seed-admin'
import { User, UserRole, COLLECTIONS } from '@/types'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  isAuthenticated: boolean
  permissions: string[]
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; pendingApproval?: boolean }>
  loginWithEmployeeCode: (code: string, password: string) => Promise<{ success: boolean; error?: string; pendingApproval?: boolean }>
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; pendingApproval?: boolean }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  isRole: (roles: UserRole | UserRole[]) => boolean
}

interface RegisterData {
  name: string
  nameAr: string
  email: string
  password: string
  phone?: string
  employeeCode?: string
  department?: string
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState<string[]>([])

  const isAuthenticated = !!user && user.status === 'active'

  // Fetch user data from Firestore
  const fetchUserData = useCallback(async (fbUser: FirebaseUser): Promise<User | null> => {
    if (!isFirebaseConfigured()) return null
    
    try {
      const db = getFirestoreDb()
      const userRef = doc(db, COLLECTIONS.USERS, fbUser.uid)
      const userSnap = await getDoc(userRef)
      
      if (!userSnap.exists()) {
        return null
      }
      
      const userDoc = userSnap.data()
      const userData: User = {
        id: fbUser.uid,
        email: fbUser.email || '',
        name: userDoc.name || fbUser.displayName || '',
        nameAr: userDoc.nameAr || userDoc.name || '',
        employeeCode: userDoc.employeeCode || '',
        role: userDoc.role || 'staff',
        roleId: userDoc.roleId || '',
        department: userDoc.department || '',
        departmentId: userDoc.departmentId || '',
        status: userDoc.status || 'pending_approval',
        avatar: fbUser.photoURL || userDoc.avatar || '',
        phone: userDoc.phone || '',
        hireDate: userDoc.hireDate || new Date().toISOString().split('T')[0],
        mustChangePassword: userDoc.mustChangePassword || false,
        createdAt: userDoc.createdAt || new Date().toISOString(),
        updatedAt: userDoc.updatedAt || new Date().toISOString(),
      }
      
      setPermissions(userDoc.permissions || [])
      return userData
    } catch (error) {
      console.error('[Auth] Error fetching user data:', error)
      return null
    }
  }, [])

  // Create user document in Firestore
  const createUserDocument = useCallback(async (
    uid: string, 
    data: Partial<User>
  ): Promise<void> => {
    if (!isFirebaseConfigured()) return
    
    const db = getFirestoreDb()
    const userRef = doc(db, COLLECTIONS.USERS, uid)
    
    const userData = {
      ...data,
      id: uid,
      status: data.status || 'pending_approval',
      role: data.role || 'staff',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    
    await setDoc(userRef, userData, { merge: true })
  }, [])

  // Create audit log
  const createAuditLog = useCallback(async (action: string, userId: string, details: string) => {
    if (!isFirebaseConfigured()) return
    
    try {
      const db = getFirestoreDb()
      const logRef = doc(collection(db, COLLECTIONS.AUDIT_LOGS))
      await setDoc(logRef, {
        action,
        userId,
        details,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('[Auth] Error creating audit log:', error)
    }
  }, [])

  // Initialize admin on first load
  useEffect(() => {
    if (isFirebaseConfigured()) {
      ensureAdminExists().catch(console.error)
    }
  }, [])

  // Auth state listener
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false)
      return
    }

    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser)
        const userData = await fetchUserData(fbUser)
        setUser(userData)
      } else {
        setUser(null)
        setFirebaseUser(null)
        setPermissions([])
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [fetchUserData])

  // Email/Password Login
  const login = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured()) {
      return { success: false, error: 'Firebase not configured' }
    }

    try {
      const auth = getFirebaseAuth()
      const result = await signInWithEmailAndPassword(auth, email, password)
      const userData = await fetchUserData(result.user)
      
      if (!userData) {
        await signOut(auth)
        return { success: false, error: 'User account not found in system' }
      }
      
      if (userData.status === 'pending_approval') {
        // Store pending ID for status check page
        localStorage.setItem('pronurse_pending_id', result.user.uid)
        await signOut(auth)
        return { success: false, pendingApproval: true, error: 'Account pending approval' }
      }
      
      if (userData.status !== 'active') {
        await signOut(auth)
        return { success: false, error: 'Account is not active. Contact administrator.' }
      }
      
      setUser(userData)
      setFirebaseUser(result.user)
      await createAuditLog('LOGIN', result.user.uid, `User logged in with email: ${email}`)
      
      // Update last login
      const db = getFirestoreDb()
      await updateDoc(doc(db, COLLECTIONS.USERS, result.user.uid), {
        lastLogin: new Date().toISOString(),
      })
      
      return { success: true }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      console.error('[Auth] Login error:', error)
      return { success: false, error: errorMessage }
    }
  }, [fetchUserData, createAuditLog])

  // Employee Code Login
  const loginWithEmployeeCode = useCallback(async (code: string, password: string) => {
    if (!isFirebaseConfigured()) {
      return { success: false, error: 'Firebase not configured' }
    }

    try {
      const db = getFirestoreDb()
      const usersRef = collection(db, COLLECTIONS.USERS)
      const q = query(usersRef, where('employeeCode', '==', code.toUpperCase()), limit(1))
      const snapshot = await getDocs(q)
      
      if (snapshot.empty) {
        return { success: false, error: 'Employee code not found' }
      }
      
      const userDoc = snapshot.docs[0].data()
      const email = userDoc.email
      
      if (!email) {
        return { success: false, error: 'No email associated with this employee code' }
      }
      
      return await login(email, password)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      console.error('[Auth] Employee code login error:', error)
      return { success: false, error: errorMessage }
    }
  }, [login])

  // Google Sign-In
  const loginWithGoogle = useCallback(async () => {
    if (!isFirebaseConfigured()) {
      return { success: false, error: 'Firebase not configured' }
    }

    try {
      const auth = getFirebaseAuth()
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      
      const result = await signInWithPopup(auth, provider)
      const db = getFirestoreDb()
      
      // Check if user exists in Firestore
      const userRef = doc(db, COLLECTIONS.USERS, result.user.uid)
      const userSnap = await getDoc(userRef)
      
      if (userSnap.exists()) {
        // Existing user
        const userData = userSnap.data()
        
        if (userData.status === 'pending_approval') {
          localStorage.setItem('pronurse_pending_id', result.user.uid)
          await signOut(auth)
          return { success: false, pendingApproval: true, error: 'Account pending approval' }
        }
        
        if (userData.status !== 'active') {
          await signOut(auth)
          return { success: false, error: 'Account is not active. Contact administrator.' }
        }
        
        // Update last login
        await updateDoc(userRef, { lastLogin: new Date().toISOString() })
        
        const fullUserData = await fetchUserData(result.user)
        setUser(fullUserData)
        setFirebaseUser(result.user)
        await createAuditLog('LOGIN', result.user.uid, 'User logged in with Google')
        
        return { success: true }
      } else {
        // New user - create with pending status
        const newUserData: Partial<User> = {
          id: result.user.uid,
          email: result.user.email || '',
          name: result.user.displayName || '',
          nameAr: result.user.displayName || '',
          avatar: result.user.photoURL || '',
          status: 'pending_approval',
          role: 'staff',
          employeeCode: '',
          department: '',
          departmentId: '',
          phone: result.user.phoneNumber || '',
          hireDate: new Date().toISOString().split('T')[0],
          mustChangePassword: false,
        }
        
        await createUserDocument(result.user.uid, newUserData)
        
        // Store pending ID and redirect to approval page
        localStorage.setItem('pronurse_pending_id', result.user.uid)
        await signOut(auth)
        
        return { success: false, pendingApproval: true, error: 'Account created - pending approval' }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed'
      console.error('[Auth] Google sign-in error:', error)
      return { success: false, error: errorMessage }
    }
  }, [fetchUserData, createUserDocument, createAuditLog])

  // Registration
  const register = useCallback(async (data: RegisterData) => {
    if (!isFirebaseConfigured()) {
      return { success: false, error: 'Firebase not configured' }
    }

    try {
      const auth = getFirebaseAuth()
      
      // Create Firebase Auth account
      const result = await createUserWithEmailAndPassword(auth, data.email, data.password)
      
      // Create user document in Firestore with pending status
      const newUserData: Partial<User> = {
        id: result.user.uid,
        email: data.email,
        name: data.name,
        nameAr: data.nameAr,
        phone: data.phone || '',
        employeeCode: data.employeeCode?.toUpperCase() || '',
        department: data.department || '',
        departmentId: '',
        status: 'pending_approval',
        role: 'staff',
        hireDate: new Date().toISOString().split('T')[0],
        mustChangePassword: false,
      }
      
      await createUserDocument(result.user.uid, newUserData)
      
      // Store pending ID for status check
      localStorage.setItem('pronurse_pending_id', result.user.uid)
      
      // Sign out since they need approval
      await signOut(auth)
      
      await createAuditLog('REGISTRATION', result.user.uid, `New user registered: ${data.email}`)
      
      return { success: true }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      console.error('[Auth] Registration error:', error)
      return { success: false, error: errorMessage }
    }
  }, [createUserDocument, createAuditLog])

  // Password Reset
  const resetPassword = useCallback(async (email: string) => {
    if (!isFirebaseConfigured()) {
      return { success: false, error: 'Firebase not configured' }
    }

    try {
      const auth = getFirebaseAuth()
      await sendPasswordResetEmail(auth, email)
      return { success: true }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed'
      console.error('[Auth] Password reset error:', error)
      return { success: false, error: errorMessage }
    }
  }, [])

  // Logout
  const logout = useCallback(async () => {
    try {
      if (user) {
        await createAuditLog('LOGOUT', user.id, 'User logged out')
      }
    } catch (e) {
      console.error('[Auth] Audit log error on logout:', e)
    }
    
    const auth = getFirebaseAuth()
    await signOut(auth)
    setUser(null)
    setFirebaseUser(null)
    setPermissions([])
    localStorage.removeItem('pronurse_pending_id')
  }, [user, createAuditLog])

  // Permission checks
  const hasPermission = useCallback((permission: string) => {
    if (!user) return false
    if (user.role === 'super_admin' || user.role === 'hospital_admin') return true
    return permissions.includes(permission)
  }, [user, permissions])

  const hasAnyPermission = useCallback((perms: string[]) => {
    return perms.some((p) => hasPermission(p))
  }, [hasPermission])

  const isRole = useCallback((roles: UserRole | UserRole[]) => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role as UserRole)
  }, [user])

  return (
    <AuthContext.Provider value={{
      user, 
      firebaseUser, 
      loading, 
      isAuthenticated, 
      permissions,
      login, 
      loginWithEmployeeCode, 
      loginWithGoogle, 
      register,
      logout,
      resetPassword,
      hasPermission, 
      hasAnyPermission, 
      isRole,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
