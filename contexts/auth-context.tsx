'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  User as FirebaseUser,
} from 'firebase/auth'
import { doc, onSnapshot, getDoc, setDoc, query, collection, where, getDocs } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { User, UserRole, COLLECTIONS } from '@/types'
import { useRouter, usePathname } from 'next/navigation'

// ============================================
// Types
// ============================================

interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  isAuthenticated: boolean
  permissions: string[]
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }>
  loginWithEmployeeCode: (code: string, password: string) => Promise<{ success: boolean; error?: string; mustChangePassword?: boolean }>
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  isRole: (roles: UserRole | UserRole[]) => boolean
}

interface RegisterData {
  name: string
  nameAr: string
  email: string
  password: string
  phone?: string
  department?: string
  departmentId?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [permissions, setPermissions] = useState<string[]>([])
  const router = useRouter()
  const pathname = usePathname()

  // مراقبة الجلسة والحالة اللحظية من Firestore
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser)
        
        const userDocRef = doc(db, COLLECTIONS.USERS, fbUser.uid)
        
        // استخدام onSnapshot لمراقبة حالة المستخدم لحظياً
        const unsubscribeDoc = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data() as User
            setUser({ ...userData, id: docSnap.id })

            // --- جلب الصلاحيات ديناميكياً من جدول الـ Roles ---
            if (userData.role === 'super_admin') {
              setPermissions(['all']) 
            } else if (userData.roleId) {
              try {
                const roleSnap = await getDoc(doc(db, COLLECTIONS.ROLES, userData.roleId))
                if (roleSnap.exists()) {
                  setPermissions(roleSnap.data().permissions || [])
                }
              } catch (error) {
                console.error("Error fetching role permissions:", error)
                setPermissions([])
              }
            }

            // التوجيه التلقائي بناءً على الحالة
            if (userData.status === 'pending_approval' && pathname !== '/pending-approval') {
              router.push('/pending-approval')
            } else if (userData.status === 'active' && pathname === '/pending-approval') {
              router.push('/dashboard')
            }
          } else {
            setUser(null)
          }
          setLoading(false)
        })

        return () => unsubscribeDoc()
      } else {
        setFirebaseUser(null)
        setUser(null)
        setPermissions([])
        setLoading(false)
        if (pathname !== '/login' && !pathname.includes('/public')) {
          router.push('/login')
        }
      }
    })

    return () => unsubscribeAuth()
  }, [pathname, router])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      const docSnap = await getDoc(doc(db, COLLECTIONS.USERS, result.user.uid))
      
      if (!docSnap.exists()) return { success: false, error: 'User profile not found' }
      const userData = docSnap.data() as User
      
      if (userData.status === 'pending_approval') return { success: false, error: 'الحساب بانتظار موافقة الإدارة' }
      if (userData.status === 'suspended') return { success: false, error: 'تم إيقاف الحساب' }
      
      return { success: true, mustChangePassword: userData.mustChangePassword }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }, [])

  const loginWithEmployeeCode = useCallback(async (code: string, password: string) => {
    try {
      const q = query(collection(db, COLLECTIONS.USERS), where("employeeCode", "==", code.toUpperCase()))
      const querySnapshot = await getDocs(q)
      
      if (querySnapshot.empty) return { success: false, error: 'كود الموظف غير صحيح' }
      
      const userData = querySnapshot.docs[0].data() as User
      return await login(userData.email, password)
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }, [login])

  const loginWithGoogle = useCallback(async () => {
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const userRef = doc(db, COLLECTIONS.USERS, result.user.uid)
      const docSnap = await getDoc(userRef)

      if (!docSnap.exists()) {
        const newUser: any = {
          name: result.user.displayName || '',
          nameAr: '',
          email: result.user.email || '',
          employeeCode: `EMP${Date.now().toString().slice(-6)}`,
          role: 'nurse',
          status: 'pending_approval',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        await setDoc(userRef, newUser)
        return { success: false, error: 'تم إنشاء الحساب. في انتظار موافقة الإدارة.' }
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }, [])

  const logout = useCallback(async () => {
    await signOut(auth)
    setUser(null)
    setFirebaseUser(null)
    router.push('/login')
  }, [router])

  const register = useCallback(async (data: RegisterData) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, data.email, data.password)
      await setDoc(doc(db, COLLECTIONS.USERS, result.user.uid), {
        name: data.name,
        nameAr: data.nameAr,
        email: data.email,
        phone: data.phone || '',
        employeeCode: `EMP${Date.now().toString().slice(-6)}`,
        role: 'nurse',
        status: 'pending_approval',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      await signOut(auth)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }, [])

  const hasPermission = useCallback((perm: string) => {
    if (user?.role === 'super_admin') return true
    return permissions.includes(perm)
  }, [permissions, user])

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
      isAuthenticated: !!user,
      permissions,
      login,
      loginWithEmployeeCode,
      loginWithGoogle,
      logout,
      register,
      hasPermission,
      hasAnyPermission: (perms) => perms.some(p => hasPermission(p)),
      hasAllPermissions: (perms) => perms.every(p => hasPermission(p)),
      isRole,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
