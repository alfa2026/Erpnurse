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
  const [isSyncing, setIsSyncing] = useState(true)

  useEffect(() => {
    // 1. وظيفة جلب البيانات من السحاب ووضعها في المتصفح (عند فتح البرنامج)
    const downloadDataFromCloud = async () => {
      if (user?.uid) {
        try {
          const docRef = doc(db, "global_backup", user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const cloudData = docSnap.data().data;
            // نضع كل البيانات القادمة من السحاب داخل LocalStorage المتصفح
            Object.keys(cloudData).forEach(key => {
              const value = typeof cloudData[key] === 'object' 
                ? JSON.stringify(cloudData[key]) 
                : cloudData[key];
              localStorage.setItem(key, value);
            });
            console.log("✅ تم استعادة كافة بيانات الـ 40 صفحة من السحاب");
          }
        } catch (error) {
          console.error("خطأ في جلب البيانات:", error);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    if (isAuthenticated && user?.uid) {
      downloadDataFromCloud();
    }
  }, [isAuthenticated, user?.uid]);

  useEffect(() => {
    // 2. وظيفة مراقبة أي تغيير ورفعه للسحاب فوراً (بدون تدخل من الصفحات)
    const uploadDataToCloud = async () => {
      if (!user?.uid) return;

      const allLocalData: Record<string, any> = {};
      // سحب كل ما هو موجود في متصفحك حالياً
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const item = localStorage.getItem(key);
            allLocalData[key] = item ? JSON.parse(item) : "";
          } catch {
            allLocalData[key] = localStorage.getItem(key);
          }
        }
      }

      if (Object.keys(allLocalData).length > 0) {
        try {
          await setDoc(doc(db, "global_backup", user.uid), {
            data: allLocalData,
            lastSync: new Date().toISOString()
          }, { merge: true });
        } catch (e) {
          console.error("فشل التزامن التلقائي:", e);
        }
      }
    };

    // تشغيل المزامنة كل 5 ثواني لضمان عدم ضياع أي حرف
    const interval = setInterval(() => {
      if (isAuthenticated) uploadDataToCloud();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user?.uid]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  // شاشة التحميل تظهر حتى ينتهي جلب البيانات من السحاب
  if (loading || (isAuthenticated && isSyncing)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-4 border-teal-600 border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">جاري مزامنة بيانات الـ 40 صفحة...</p>
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
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
