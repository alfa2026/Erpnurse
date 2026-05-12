'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Hospital, Clock, CheckCircle2, XCircle, RefreshCw, LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/lang-context'
import { doc, getDoc } from 'firebase/firestore'
import { getFirestoreDb, isFirebaseConfigured } from '@/lib/firebase'
import { COLLECTIONS } from '@/types'

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'loading'

export default function PendingApprovalPage() {
  const router = useRouter()
  const { logout } = useAuth()
  const { lang, toggleLang } = useLang()
  const isAr = lang === 'ar'

  const [status, setStatus] = useState<ApprovalStatus>('loading')
  const [checking, setChecking] = useState(false)
  const [userName, setUserName] = useState('')

  const checkStatus = useCallback(async () => {
    setChecking(true)
    
    // Get pending user ID from localStorage
    const pendingId = localStorage.getItem('pronurse_pending_id')
    
    if (!pendingId) {
      router.push('/login')
      return
    }

    if (!isFirebaseConfigured()) {
      setStatus('pending')
      setChecking(false)
      return
    }

    try {
      const db = getFirestoreDb()
      const userRef = doc(db, COLLECTIONS.USERS, pendingId)
      const userSnap = await getDoc(userRef)

      if (!userSnap.exists()) {
        // User document doesn't exist, go back to login
        localStorage.removeItem('pronurse_pending_id')
        router.push('/login')
        return
      }

      const userData = userSnap.data()
      setUserName(userData.nameAr || userData.name || '')

      if (userData.status === 'active') {
        setStatus('approved')
        // Clear pending ID and redirect to dashboard after a short delay
        setTimeout(() => {
          localStorage.removeItem('pronurse_pending_id')
          router.push('/dashboard')
        }, 2000)
      } else if (userData.status === 'inactive' || userData.status === 'rejected') {
        setStatus('rejected')
        localStorage.removeItem('pronurse_pending_id')
      } else {
        setStatus('pending')
      }
    } catch (error) {
      console.error('[PendingApproval] Error checking status:', error)
      setStatus('pending')
    } finally {
      setChecking(false)
    }
  }, [router])

  // Initial check and auto-refresh every 10 seconds
  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 10000)
    return () => clearInterval(interval)
  }, [checkStatus])

  const handleLogout = async () => {
    localStorage.removeItem('pronurse_pending_id')
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      {/* Language toggle */}
      <button
        onClick={toggleLang}
        className="fixed top-4 left-4 px-3 py-1.5 rounded-full border border-teal-300 bg-white/80 dark:bg-slate-800/80 text-xs font-bold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-700 z-50 shadow-sm backdrop-blur-sm"
      >
        {isAr ? 'EN' : 'ع'}
      </button>

      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg shadow-teal-500/20">
              <Hospital className="h-9 w-9 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-teal-700 dark:text-teal-400">PRO Nurse</h1>
        </div>

        <Card className="shadow-xl border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm overflow-hidden">
          {/* Colored top bar */}
          <div className={`h-1.5 w-full ${
            status === 'approved' ? 'bg-green-500' :
            status === 'rejected' ? 'bg-red-500' :
            status === 'loading' ? 'bg-slate-300' :
            'bg-amber-400'
          }`} />

          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-5">
            {/* Loading state */}
            {status === 'loading' && (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <Loader2 className="h-10 w-10 text-slate-400 animate-spin" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold">{isAr ? 'جاري التحقق...' : 'Checking status...'}</h2>
                </div>
              </>
            )}

            {/* Pending state */}
            {status === 'pending' && (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950 animate-pulse">
                  <Clock className="h-10 w-10 text-amber-500" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold">
                    {isAr ? 'في انتظار الموافقة' : 'Awaiting Approval'}
                  </h2>
                  {userName && (
                    <p className="text-sm text-muted-foreground">
                      {isAr ? `مرحباً ${userName}` : `Hello ${userName}`}
                    </p>
                  )}
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                    {isAr
                      ? 'تم تسجيل طلبك بنجاح. يرجى الانتظار حتى يقوم المدير أو المسؤول بمراجعة طلبك ومنحك الصلاحيات المناسبة.'
                      : 'Your request has been submitted. Please wait for an admin or supervisor to review and assign your role.'}
                  </p>
                </div>

                {/* Progress steps */}
                <div className="w-full space-y-2 text-sm">
                  {[
                    { done: true, ar: 'تم إنشاء الحساب', en: 'Account created' },
                    { done: true, ar: 'إرسال طلب الوصول', en: 'Access request submitted' },
                    { done: false, ar: 'مراجعة الطلب من المدير', en: 'Admin review in progress' },
                    { done: false, ar: 'تفعيل الحساب ومنح الصلاحية', en: 'Account activation' },
                  ].map((step, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${step.done ? 'bg-green-50 dark:bg-green-950/40' : 'bg-muted/50'}`}>
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${step.done ? 'bg-green-500 text-white' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                        {step.done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                      </div>
                      <span className={step.done ? 'text-green-700 dark:text-green-400 font-medium' : 'text-muted-foreground'}>
                        {isAr ? step.ar : step.en}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 w-full pt-1">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={checkStatus}
                    disabled={checking}
                  >
                    <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
                    {isAr ? 'تحديث الحالة' : 'Check Status'}
                  </Button>
                  <Button
                    variant="ghost"
                    className="gap-2 text-muted-foreground"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    {isAr ? 'خروج' : 'Logout'}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  {isAr ? 'يتم التحديث تلقائياً كل 10 ثوانٍ' : 'Auto-refreshes every 10 seconds'}
                </p>
              </>
            )}

            {/* Approved state */}
            {status === 'approved' && (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-green-700 dark:text-green-400">
                    {isAr ? 'تمت الموافقة!' : 'Approved!'}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {isAr ? 'تمت الموافقة على حسابك. جاري توجيهك للوحة التحكم...' : 'Your account has been approved. Redirecting to dashboard...'}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-green-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">{isAr ? 'جاري التحويل...' : 'Redirecting...'}</span>
                </div>
              </>
            )}

            {/* Rejected state */}
            {status === 'rejected' && (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
                  <XCircle className="h-10 w-10 text-red-500" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
                    {isAr ? 'تم رفض الطلب' : 'Request Rejected'}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed max-w-sm">
                    {isAr
                      ? 'تم رفض طلب وصولك. يرجى التواصل مع مدير النظام للمزيد من المعلومات.'
                      : 'Your access request was rejected. Please contact the system administrator for more information.'}
                  </p>
                </div>

                <Button onClick={handleLogout} className="gap-2">
                  <LogOut className="h-4 w-4" />
                  {isAr ? 'العودة لتسجيل الدخول' : 'Back to Login'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact info */}
        <p className="text-center text-xs text-muted-foreground">
          {isAr ? 'للمساعدة تواصل مع:' : 'For assistance contact:'} support@pronurse.com
        </p>
      </div>
    </div>
  )
}
