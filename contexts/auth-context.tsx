'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth'
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase'
import { getDocument, getUserByEmployeeCode, createAuditLog } from '@/lib/firebase-services'
import { User, UserRole, COLLECTIONS } from '@/types'

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  isAuthenticated: boolean
  permissions: string[]
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithEmployeeCode: (code: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  isRole: (roles: UserRole | UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState<string[]>([])

  const isAuthenticated = !!user && user.status === 'active'

  const fetchUserData = useCallback(async (fbUser: FirebaseUser) => {
    const userDoc = await getDocument('users', fbUser.uid)
    if (!userDoc) {
      await signOut(getFirebaseAuth())
      setUser(null)
      setFirebaseUser(null)
      setLoading(false)
      return
    }
    const userData = {
      id: fbUser.uid,
      email: fbUser.email || '',
      name: userDoc.name || fbUser.displayName || '',
      nameAr: userDoc.nameAr || userDoc.name || '',
      employeeCode: userDoc.employeeCode || '',
      role: userDoc.role || 'staff',
      department: userDoc.department || '',
      status: userDoc.status || 'active',
      photoURL: fbUser.photoURL || '',
      phone: userDoc.phone || '',
      hireDate: userDoc.hireDate || '',
    }
    setUser(userData as User)
    setFirebaseUser(fbUser)
    setPermissions(userDoc.permissions || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false)
      return
    }
    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        await fetchUserData(fbUser)
      } else {
        setUser(null)
        setFirebaseUser(null)
        setPermissions([])
        setLoading(false)
      }
    })
    return () => unsubscribe()
  }, [fetchUserData])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const auth = getFirebaseAuth()
      const result = await signInWithEmailAndPassword(auth, email, password)
      await fetchUserData(result.user)
      await createAuditLog('LOGIN', result.user.uid, 'User logged in with email')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }, [fetchUserData])

  const loginWithEmployeeCode = useCallback(async (code: string, password: string) => {
    try {
      const { email } = await getUserByEmployeeCode(code)
      if (!email) return { success: false, error: 'Employee code not found' }
      return await login(email, password)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }, [login])

  const loginWithGoogle = useCallback(async () => {
    try {
      const auth = getFirebaseAuth()
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const userDoc = await getDocument('users', result.user.uid)
      if (!userDoc) {
        await signOut(auth)
        return { success: false, error: 'Account not found. Please register first.' }
      }
      await fetchUserData(result.user)
      await createAuditLog('LOGIN', result.user.uid, 'User logged in with Google')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }, [fetchUserData])

  const logout = useCallback(async () => {
    try {
      await createAuditLog('LOGOUT', user?.id || '', 'User logged out')
    } catch (e) {}
    await signOut(getFirebaseAuth())
    setUser(null)
    setFirebaseUser(null)
    setPermissions([])
  }, [user])

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false
    if (user.role === 'super_admin' || user.role === 'admin') return true
    return permissions.includes(permission)
  }, [user, permissions])

  const hasAnyPermission = useCallback((perms: string[]) => {
    return perms.some((p) => hasPermission(p))
  }, [hasPermission])

  const isRole = useCallback((roles: UserRole | UserRole[]) => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }, [user])

  return (
    <AuthContext.Provider value={{
      user, firebaseUser, loading, isAuthenticated, permissions,
      login, loginWithEmployeeCode, loginWithGoogle, logout,
      hasPermission, hasAnyPermission, isRole,
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
