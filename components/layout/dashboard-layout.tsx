'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Topbar } from '@/components/layout/topbar'
import { useAuth } from '@/contexts/auth-context'
import { useGlobalSync } from '@/hooks/useGlobalSync' // استدعاء المحرك
import { db } from '@/lib/firebase'
import { doc, onSnapshot } from 'firebase/firestore'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const { autoSave } = useGlobalSync()
  const [globalState, setGlobalState] = useState<any>(null)

  // 1. مراقب سحابي: أول ما البرنامج يفتح، يسحب داتا المستشفى كلها
  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      const unsub = onSnapshot(doc(db, "hospital_data", user.uid), (doc) => {
        if (doc.exists()) {
          // هنا بنحط الداتا في الـ State العالمي للبرنامج
          setGlobalState(doc.data())
          console.log("تم سحب بيانات النظام بالكامل من السحاب")
        }
      })
      return () => unsub()
    }
  }, [isAuthenticated, user?.uid])

  // 2. المزامنة التلقائية: أي حرف يتغير في السيستم يروح للفايربيز فوراً
  useEffect(() => {
    if (globalState && user?.uid) {
      const timer = setTimeout(() => {
        autoSave('hospital_data', user.uid, globalState)
      }, 2000) // تأخير ثانيتين عشان ميضغطش على السيرفر
      return () => clearTimeout(timer)
    }
  }, [globalState, user?.uid])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-teal-600 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">جاري تحميل النظام السحابي...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <Topbar />
        {/* الميزة هنا: أي صفحة (children) هتتأثر بنظام المزامنة الجديد */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
