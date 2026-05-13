'use client'

import { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
// تم التعديل هنا لإضافة الأقواس {} لتطابق الـ Named Export
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Topbar } from '@/components/layout/topbar'
import { useAuth } from '@/contexts/auth-context'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>
  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950" dir="rtl">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
