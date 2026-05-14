'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { Topbar } from '@/components/layout/topbar'
import { useAuth } from '@/contexts/auth-context'
import { db } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)

  // 1. التأكد من أننا في بيئة المتصفح أولاً لمنع أخطاء الـ Rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 2. نظام التوجيه الصارم (Redirect Logic)
  useEffect(() => {
    if (isClient && !loading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isAuthenticated, loading, router, isClient])

  // 3. محرك المزامنة "الخلفي" (لا يعيق تحميل الصفحات)
  useEffect(() => {
    if (isAuthenticated && user?.uid && isClient) {
      const sync = async () => {
        try {
          // جلب البيانات فقط عند أول دخول
          const snap = await getDoc(doc(db, "cloud_sync", user.uid))
          if (snap.exists()) {
            const data = snap.data().storage
            Object.keys(data).forEach(key => {
              if (!localStorage.getItem(key)) { // لا نغير داتا موجودة حالياً
                localStorage.setItem(key, typeof data[key] === 'object' ? JSON.stringify(data[key]) : data[key])
              }
            })
          }
        } catch (e) { console.log("Silent Sync active") }
      }
      sync()

      // حفظ تلقائي كل دقيقتين لضمان عدم الكسر
      const saver = setInterval(() => {
        const all: any = {}
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i)
          if (k) try { all[k] = JSON.parse(localStorage.getItem(k) || "") } catch { all[k] = localStorage.getItem(k) }
        }
        setDoc(doc(db, "cloud_sync", user.uid), { storage: all, lastSeen: new Date() }, { merge: true })
      }, 120000)

      return () => clearInterval(saver)
    }
  }, [isAuthenticated, user?.uid, isClient])

  // شاشة انتظار بيضاء بسيطة جداً (Standard)
  if (!isClient || loading) {
    return <div className="min-h-screen bg-white" />
  }

  // لو مش مسجل دخول، ما تعرضش أي حاجة من الداشبورد
  if (!isAuthenticated) return null

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <Topbar />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {/* هنا الـ children هتحمل طبيعي جداً بدون تعليق */}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
