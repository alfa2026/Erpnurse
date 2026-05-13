'use client'

import { usePermissions } from '@/hooks/use-permissions'
import { ShieldAlert, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface PermissionGuardProps {
  permission: string
  children: React.ReactNode
}

export function PermissionGuard({ permission, children }: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermissions()

  // حالة التحميل: بنعرض شكل لطيف لحد ما نتأكد من صلاحياته
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="mr-3 font-medium">جاري التحقق من صلاحياتك...</span>
      </div>
    )
  }

  // لو ملوش صلاحية: بنعرض رسالة المنع
  if (!hasPermission(permission)) {
    return (
      <div className="h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 m-4">
        <div className="bg-red-100 p-4 rounded-full mb-6">
          <Lock className="h-12 w-12 text-red-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">منطقة محظورة!</h2>
        <p className="text-slate-500 max-w-md text-lg">
          عذراً، حسابك لا يملك تصريح ( {permission} ) للوصول إلى هذه الصفحة.
          يرجى مراجعة مسؤول النظام لتعديل صلاحياتك.
        </p>
        <div className="flex gap-4 mt-8">
          <Button asChild variant="outline">
            <Link href="/dashboard">العودة للرئيسية</Link>
          </Button>
          <Button asChild className="bg-indigo-600">
            <Link href="/support">طلب مساعدة</Link>
          </Button>
        </div>
      </div>
    )
  }

  // لو معاه الصلاحية: بنعرض محتوى الصفحة عادي
  return <>{children}</>
}

