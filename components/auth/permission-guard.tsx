'use client'

import { usePermissions } from '@/hooks/use-permissions'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function PermissionGuard({ 
  permission, 
  children 
}: { 
  permission: string; 
  children: React.ReactNode 
}) {
  const { hasPermission, isLoading } = usePermissions()

  if (isLoading) return <div className="p-10 text-center font-bold">جاري فحص التصاريح...</div>

  if (!hasPermission(permission)) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-3xl m-4 border-2 border-dashed border-slate-200">
        <div className="bg-red-100 p-4 rounded-full mb-4">
          <Lock className="h-10 w-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">منطقة محمية</h2>
        <p className="text-slate-500 mt-2 max-w-sm">
          حسابك لا يملك صلاحية الوصول لهذه الصفحة. يرجى مراجعة إدارة النظام.
        </p>
        <Button asChild className="mt-6 bg-indigo-600 hover:bg-indigo-700">
          <Link href="/dashboard">العودة للوحة التحكم</Link>
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
