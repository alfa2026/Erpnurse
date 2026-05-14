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
  const [authChecked, setAuthChecked] = useState(false)

  // 1. نظام التوجيه: لو مش مسجل دخول، ارميه لصفحة الـ /login فوراً
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.replace('/login') // يوديه للوجن لو ملوش صلاحية
      } else {
        setAuthChecked(true) // مسموح له يشوف الداشبورد
      }
    }
  }, [isAuthenticated, loading, router])

  // 2. المزامنة السحابية: بتبدأ فقط "بعد" التأكد من تسجيل الدخول
  useEffect(() => {
    let interval: any;
    if (isAuthenticated && user?.uid) {
      const syncData = async () => {
        try {
          // سحب البيانات المخزنة سابقاً للمستخدم
          const snap = await getDoc(doc(db, "global_sync", user.uid))
          if (snap.exists()) {
            const data = snap.data().payload
            Object.keys(data).forEach(k => localStorage.setItem(k, typeof data[k] === 'object' ? JSON.stringify(data[k]) : data[k]))
          }
        } catch (e) { console.log("Sync pull skipped") }

        // رفع البيانات تلقائياً كل دقيقة لعدم إرهاق السيرفر
        interval = setInterval(async () => {
          const allLocal: any = {}
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)
            if (k) try { allLocal[k] = JSON.parse(localStorage.getItem(k) || "") } catch { allLocal[k] = localStorage.getItem(k) }
          }
          await setDoc(doc(db, "global_sync", user.uid), { payload: allLocal, updatedAt: new Date() }, { merge: true })
        }, 60000)
      }
      syncData()
    }
    return () => clearInterval(interval)
  }, [isAuthenticated, user?.uid])

  // شاشة تحميل بسيطة جداً بتظهر ثانية واحدة بس لحد ما يتأكد إنت مين
  if (loading || (!isAuthenticated && !authChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-10 w-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // لو مش مسجل، الكود اللي فوق هيعمل redirect ومش هيوصل لهنا أصلاً
  if (!isAuthenticated) return null

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <Topbar />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
