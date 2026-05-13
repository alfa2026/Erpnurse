'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Topbar } from '@/components/layout/topbar'
import { useAuth } from '@/contexts/auth-context'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  // لو التحميل خلص ومفيش يوزر، يرميه على اللوجن
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  // طول ما هو بيحمل أو مفيش يوزر، ميعرضش حاجة عشان ميعملش Loop
  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-teal-600"></div>
      </div>
    )
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
