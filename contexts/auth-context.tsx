'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useRef } from 'react'
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
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore'
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
  refreshUser: () => Promise<void>
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
  
  // Track unsubscribers for cleanup
  const userUnsubRef = useRef<Unsubscribe | null>(null)
  const roleUnsubRef = useRef<Unsubscribe | null>(null)

  const isAuthenticated = !!user && user.status === 'active'

  // Fetch role permissions from Firestore
  const fetchRolePermissions = useCallback(async (roleId: string): Promise<string[]> => {
    if (!isFirebaseConfigured() || !roleId) return []
    
    try {
      const db = getFirestoreDb()
      const roleRef = doc(db, COLLECTIONS.ROLES, roleId)
      const roleSnap = await getDoc(roleRef)
      
      if (roleSnap.exists()) {
        return roleSnap.data().permissions || []
      }
      return []
    } catch (error) {
      console.error('[Auth] Error fetching role permissions:', error)
      return []
    }
  }, [])

  // Subscribe to user document for real-time updates
  const subscribeToUserDocument = useCallback((uid: string) => {
    if (!isFirebaseConfigured()) return

    // Cleanup previous subscription
    if (userUnsubRef.current) {
      userUnsubRef.current()
    }

    const db = getFirestoreDb()
    const userRef = doc(db, COLLECTIONS.USERS, uid)

    userUnsubRef.current = onSnapshot(userRef, async (snapshot) => {
      if (!snapshot.exists()) {
        // User document deleted - force logout
        console.log('[Auth] User document deleted, logging out')
        setUser(null)
        setPermissions([])
        const auth = getFirebaseAuth()
        await signOut(auth)
        return
      }

      const userDoc = snapshot.data()
      
      // Check if user was blocked/deactivated - auto logout
      if (userDoc.status === 'rejected' || userDoc.status === 'inactive') {
        console.log('[Auth] User blocked/deactivated, logging out')
        setUser(null)
        setPermissions([])
        const auth = getFirebaseAuth()
        await signOut(auth)
        return
      }

      // Build user data
      const userData: User = {
        id: uid,
        email: userDoc.email || '',
        name: userDoc.name || '',
        nameAr: userDoc.nameAr || userDoc.name || '',
        employeeCode: userDoc.employeeCode || '',
        role: userDoc.role || 'staff',
        roleId: userDoc.roleId || '',
        department: userDoc.department || '',
        departmentId: userDoc.departmentId || '',
        status: userDoc.status || 'pending_approval',
        avatar: userDoc.avatar || userDoc.photoURL || '',
        phone: userDoc.phone || '',
        hireDate: userDoc.hireDate || new Date().toISOString().split('T')[0],
        mustChangePassword: userDoc.mustChangePassword || false,
        createdAt: userDoc.createdAt || new Date().toISOString(),
        updatedAt: userDoc.updatedAt || new Date().toISOString(),
      }

      setUser(userData)

      // Fetch permissions from role document
      if (userDoc.roleId) {
        const perms = await fetchRolePermissions(userDoc.roleId)
        setPermissions(perms)
      } else if (userDoc.permissions) {
        setPermissions(userDoc.permissions)
      } else {
        // Default permissions based on role
        const defaultPerms = getDefaultPermissions(userDoc.role)
        setPermissions(defaultPerms)
      }
    }, (error) => {
      console.error('[Auth] User subscription error:', error)
    })
  }, [fetchRolePermissions])

  // Get default permissions based on role
  const getDefaultPermissions = (role: string): string[] => {
    switch (role) {
      case 'super_admin':
      case 'hospital_admin':
        return ['*'] // All permissions
      case 'admin':
        return [
          'users.view', 'users.create', 'users.edit', 'users.delete',
          'departments.view', 'departments.create', 'departments.edit',
          'reports.view', 'reports.create',
          'schedules.view', 'schedules.create', 'schedules.edit',
          'attendance.view', 'attendance.edit',
        ]
      case 'head_nurse':
        return [
          'users.view', 'departments.view', 'departments.edit',
          'schedules.view', 'schedules.create', 'schedules.edit',
          'attendance.view', 'attendance.edit',
          'reports.view', 'reports.create',
          'patients.view', 'patients.edit',
        ]
      case 'supervisor':
        return [
          'users.view', 'departments.view',
          'schedules.view', 'attendance.view', 'attendance.edit',
          'patients.view',
        ]
      case 'nurse':
      case 'doctor':
        return [
          'patients.view', 'patients.edit',
          'schedules.view', 'attendance.view',
        ]
      default:
        return ['dashboard.view']
    }
  }

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

  // Auth state listener with real-time user subscription
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false)
      return
    }

    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser)
        
        // Check if user exists in Firestore
        const db = getFirestoreDb()
        const userRef = doc(db, COLLECTIONS.USERS, fbUser.uid)
        const userSnap = await getDoc(userRef)
        
        if (userSnap.exists()) {
          // Subscribe to real-time updates
          subscribeToUserDocument(fbUser.uid)
        } else {
          // User not in Firestore yet
          setUser(null)
        }
      } else {
        // Cleanup subscriptions on logout
        if (userUnsubRef.current) {
          userUnsubRef.current()
          userUnsubRef.current = null
        }
        if (roleUnsubRef.current) {
          roleUnsubRef.current()
          roleUnsubRef.current = null
        }
        setUser(null)
        setFirebaseUser(null)
        setPermissions([])
      }
      setLoading(false)
    })

    return () => {
      unsubscribe()
      if (userUnsubRef.current) userUnsubRef.current()
      if (roleUnsubRef.current) roleUnsubRef.current()
    }
  }, [subscribeToUserDocument])

  // Refresh user data manually
  const refreshUser = useCallback(async () => {
    if (firebaseUser) {
      subscribeToUserDocument(firebaseUser.uid)
    }
  }, [firebaseUser, subscribeToUserDocument])

  // Email/Password Login
  const login = useCallback(async (email: string, password: string) => {
    if (!isFirebaseConfigured()) {
      return { success: false, error: 'Firebase not configured' }
    }

    try {
      const auth = getFirebaseAuth()
      const result = await signInWithEmailAndPassword(auth, email, password)
      const db = getFirestoreDb()
      
      // Check user status in Firestore
      const userRef = doc(db, COLLECTIONS.USERS, result.user.uid)
      const userSnap = await getDoc(userRef)
      
      if (!userSnap.exists()) {
        await signOut(auth)
        return { success: false, error: 'User account not found in system' }
      }
      
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
      
      // Subscribe to real-time updates
      subscribeToUserDocument(result.user.uid)
      setFirebaseUser(result.user)
      
      await createAuditLog('LOGIN', result.user.uid, `User logged in with email: ${email}`)
      
      // Update last login
      await updateDoc(userRef, { lastLogin: new Date().toISOString() })
      
      return { success: true }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      console.error('[Auth] Login error:', error)
      
      // Translate Firebase errors to user-friendly messages
      if (errorMessage.includes('auth/invalid-credential') || errorMessage.includes('auth/wrong-password')) {
        return { success: false, error: 'Invalid email or password' }
      }
      if (errorMessage.includes('auth/user-not-found')) {
        return { success: false, error: 'User not found' }
      }
      if (errorMessage.includes('auth/too-many-requests')) {
        return { success: false, error: 'Too many failed attempts. Please try again later.' }
      }
      
      return { success: false, error: errorMessage }
    }
  }, [createAuditLog, subscribeToUserDocument])

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
        
        // Subscribe to real-time updates
        subscribeToUserDocument(result.user.uid)
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
        
        await createAuditLog('REGISTRATION', result.user.uid, `New user registered via Google: ${result.user.email}`)
        
        return { success: false, pendingApproval: true, error: 'Account created - pending approval' }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign-in failed'
      console.error('[Auth] Google sign-in error:', error)
      
      if (errorMessage.includes('popup-closed')) {
        return { success: false, error: 'Sign-in cancelled' }
      }
      
      return { success: false, error: errorMessage }
    }
  }, [createUserDocument, createAuditLog, subscribeToUserDocument])

  // Registration
  const register = useCallback(async (data: RegisterData) => {
    if (!isFirebaseConfigured()) {
      return { success: false, error: 'Firebase not configured' }
    }

    try {
      const auth = getFirebaseAuth()
      const db = getFirestoreDb()
      
      // Check if employee code already exists
      if (data.employeeCode) {
        const codeQuery = query(
          collection(db, COLLECTIONS.USERS),
          where('employeeCode', '==', data.employeeCode.toUpperCase()),
          limit(1)
        )
        const codeSnap = await getDocs(codeQuery)
        if (!codeSnap.empty) {
          return { success: false, error: 'Employee code already registered' }
        }
      }
      
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
      
      if (errorMessage.includes('email-already-in-use')) {
        return { success: false, error: 'Email already registered' }
      }
      if (errorMessage.includes('weak-password')) {
        return { success: false, error: 'Password is too weak. Use at least 6 characters.' }
      }
      
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
      
      if (errorMessage.includes('user-not-found')) {
        return { success: false, error: 'No account found with this email' }
      }
      
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
    
    // Cleanup subscriptions
    if (userUnsubRef.current) {
      userUnsubRef.current()
      userUnsubRef.current = null
    }
    if (roleUnsubRef.current) {
      roleUnsubRef.current()
      roleUnsubRef.current = null
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
    if (permissions.includes('*')) return true
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
      refreshUser,
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
