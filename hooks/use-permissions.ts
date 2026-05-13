'use client'

import { useAuth } from '@/contexts/auth-context'
import { useFirestoreCollection } from '@/hooks/use-firestore'
import { COLLECTIONS, Role } from '@/types'

export function usePermissions() {
  const { user } = useAuth()
  // جلب الأدوار من كولكشن roles حسب التسمية في ملف الـ types
  const { data: roles, loading } = useFirestoreCollection(COLLECTIONS.ROLES)

  const hasPermission = (permissionId: string) => {
    if (!user || !roles) return false

    // السوبر أدمن له صلاحية كاملة دائماً
    if (user.role === 'super_admin') return true

    // البحث عن الدور المربوط بالموظف باستخدام roleId
    const userRole = roles.find((r: Role) => r.id === user.roleId)
    
    // فحص هل الـ permissionId موجود في مصفوفة الصلاحيات (string[])
    return userRole?.permissions?.includes(permissionId) || false
  }

  return { hasPermission, isLoading: loading }
}
