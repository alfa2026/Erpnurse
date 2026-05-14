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
  const { isAuthenticated, loading: authLoading, user } = useAuth()
  const router = useRouter()
  const [dataSyncing, setDataSyncing] = useState(true)

  // 1. مراقبة الدخول (بدون تداخل مع البيانات)
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  // 2. سحب البيانات من السحاب "مرة واحدة فقط" عند الدخول بنجاح
  useEffect(() => {
    const downloadOnce = async () => {
      if (isAuthenticated && user?.uid) {
        try {
          const docSnap = await getDoc(doc(db, "global_backup", user.uid))
          if (docSnap.exists()) {
            const cloudData = docSnap.data().data
            Object.keys(cloudData).forEach(key => {
              const val = typeof cloudData[key] === 'object' ? JSON.stringify(cloudData[key]) : cloudData[key]
              localStorage.setItem(key, val)
            })
            console.log("✅ البيانات استرجعت")
          }
        } catch (e) { console.error(e) }
        finally { setDataSyncing(false) }
      }
    }
    if (!authLoading && isAuthenticated) downloadOnce()
    else if (!authLoading && !isAuthenticated) setDataSyncing(false)
  }, [isAuthenticated, authLoading, user?.uid])

  // 3. المزامنة التلقائية (الرفع للسحاب كل 10 ثوانٍ)
  useEffect(() => {
    const upload = async () => {
      if (!isAuthenticated || !user?.uid) return
      const allData: any = {}
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k) {
          try { allData[k] = JSON.parse(localStorage.getItem(k) || "") }
          catch { allData[k] = localStorage.getItem(k) }
        }
      }
      if (Object.keys(allData).length > 0) {
        await setDoc(doc(db, "global_backup", user.uid), { data: allData, lastUpdate: new Date() }, { merge: true })
      }
    }
    const interval = setInterval(upload, 10000)
    return () => clearInterval(interval)
  }, [isAuthenticated, user?.uid])

  // 🚧 منع الريندر لو لسه بيحمل الـ Auth أو الداتا
  if (authLoading || (isAuthenticated && dataSyncing)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-teal-600 border-t-transparent animate-spin" />
          <p className="text-sm font-bold">جاري تأمين الاتصال بالسحاب...</p>
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
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
