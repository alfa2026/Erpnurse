'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Topbar } from '@/components/layout/topbar'
import { useAuth } from '@/contexts/auth-context'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const [dataLoaded, setDataLoaded] = useState(false)

  // 1. حماية المسار: لو مش مسجل يروح لوجن، لو مسجل يكمل
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  // 2. مزامنة البيانات الصامتة (بدون تعطيل الشاشة)
  useEffect(() => {
    const syncData = async () => {
      if (isAuthenticated && user?.uid) {
        try {
          // جلب البيانات من السحاب مرة واحدة عند الدخول
          const snap = await getDoc(doc(db, "global_backup", user.uid))
          if (snap.exists()) {
            const data = snap.data().data
            Object.keys(data).forEach(key => {
              const val = typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key]
              localStorage.setItem(key, val)
            })
          }
        } catch (e) { console.log("Cloud sync error (Safe to ignore)") }
        finally { setDataLoaded(true) }
      }
    }
    if (!loading && isAuthenticated) syncData()
    else if (!loading) setDataLoaded(true)
  }, [isAuthenticated, loading, user?.uid])

  // شاشة تحميل خفيفة في البداية فقط
  if (loading || !dataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <Topbar />
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
