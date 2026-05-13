'use client'

import { useAuth } from '@/contexts/auth-context'
import { useFirestoreCollection } from '@/hooks/use-firestore'
import { COLLECTIONS, Role } from '@/types'

export function usePermissions() {
  const { user } = useAuth()
  const { data: roles } = useFirestoreCollection(COLLECTIONS.ROLES)

  const hasPermission = (permissionId: string) => {
    if (!user || !roles) return false

    // السوبر أدمن مسموح له بكل شيء دائماً
    if (user.role === 'super_admin') return true

    // البحث عن الدور المربوط بالموظف
    const userRole = roles.find((r: Role) => r.id === user.roleId)
    
    // التحقق هل الصلاحية المطلوبة موجودة في مصفوفة صلاحيات الدور ده
    return userRole?.permissions?.includes(permissionId) || false
  }

  return { hasPermission, isLoading: !roles }
}
