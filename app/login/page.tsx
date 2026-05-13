'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye, EyeOff, Lock, IdCard, Hospital, LogIn,
  Mail, UserPlus, Headphones, ShieldCheck,
} from 'lucide-react'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
// تم إزالة DEMO_EMPLOYEES لأنه لم يعد موجوداً في الـ context الجديد
import { useAuth } from '@/contexts/auth-context' 
import { useLang }  from '@/contexts/lang-context'
import { toast }    from 'sonner'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4 flex-shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  // تم إزالة changePassword من الـ destructuring لأننا سنعتمد على التغيير اليدوي للأدمن حالياً
  const { login, loginWithGoogle, loginWithEmployeeCode, register } = useAuth()
  const { lang, toggleLang } = useLang()
  const isAr = lang === 'ar'

  const [tab, setTab] = useState<'employee'|'admin'|'google'>('employee')

  // employee tab
  const [empCode,     setEmpCode]     = useState('')
  const [empPwd,      setEmpPwd]      = useState('')
  const [showEmpPwd,  setShowEmpPwd]  = useState(false)
  const [empLoading,  setEmpLoading]  = useState(false)

  // admin tab
  const [adminEmail,  setAdminEmail]  = useState('')
  const [adminPwd,    setAdminPwd]    = useState('')
  const [showAdminPwd,setShowAdminPwd]= useState(false)
  const [adminLoading,setAdminLoading]= useState(false)

  // google
  const [gLoading,    setGLoading]    = useState(false)

  // signup dialog
  const [signupOpen,  setSignupOpen]  = useState(false)
  const [sName,       setSName]       = useState('')
  const [sEmail,      setSEmail]      = useState('')
  const [sPwd,        setSPwd]        = useState('')
  const [sLoading,    setSLoading]    = useState(false)

  // force-change password
  const [mustChange,  setMustChange]  = useState(false)
  const [newPwd,      setNewPwd]      = useState('')
  const [confirmPwd,  setConfirmPwd]  = useState('')

  // IT support
  const [itOpen, setItOpen] = useState(false)

  /* ── Employee Code Login ─────────────────────── */
  const handleEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empCode.trim() || !empPwd.trim()) {
      toast.error(isAr ? 'أدخل كود الموظف وكلمة المرور' : 'Enter employee code and password')
      return
    }
    setEmpLoading(true)
    try {
      const res = await loginWithEmployeeCode(empCode.trim(), empPwd.trim())
      if (!res.success) {
        toast.error(isAr ? 'خطأ في بيانات الدخول' : 'Login failed', { description: res.error })
      } else if (res.mustChangePassword) {
        setMustChange(true)
      } else {
        toast.success(isAr ? 'مرحباً بك' : 'Welcome back!'); router.push('/dashboard')
      }
    } finally { setEmpLoading(false) }
  }

  /* ── Admin Email Login ───────────────────────── */
  const handleAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminEmail.trim() || !adminPwd.trim()) {
      toast.error(isAr ? 'أدخل البريد وكلمة المرور' : 'Enter email and password')
      return
    }
    setAdminLoading(true)
    try {
      const res = await login(adminEmail.trim(), adminPwd.trim())
      if (!res.success) {
        toast.error(isAr ? 'خطأ في بيانات الدخول' : 'Login failed', { description: res.error })
      } else if (res.mustChangePassword) {
        setMustChange(true)
      } else {
        toast.success(isAr ? 'مرحباً بك' : 'Welcome back!'); router.push('/dashboard')
      }
    } finally { setAdminLoading(false) }
  }

  /* ── Google Sign-In ──────────────────────────── */
  const handleGoogle = async () => {
    setGLoading(true)
    try {
      const res = await loginWithGoogle()
      if (res.success) {
        toast.success(isAr ? 'تم تسجيل الدخول بنجاح' : 'Signed in!')
        router.push('/dashboard')
      } else {
        toast.error(isAr ? 'فشل تسجيل الدخول بـ Google' : 'Google sign-in failed', { description: res.error })
      }
    } catch (err: unknown) {
      toast.error(isAr ? 'خطأ في Google' : 'Google error', {
        description: err instanceof Error ? err.message : '',
      })
    } finally { setGLoading(false) }
  }

  /* ── Signup ──────────────────────────────────── */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sName.trim() || !sEmail.trim() || sPwd.length < 6) {
      toast.error(isAr ? 'أدخل جميع البيانات (كلمة المرور 6 أحرف على الأقل)' : 'Fill all fields (password ≥ 6 chars)')
      return
    }
    setSLoading(true)
    try {
      const res = await register({ name: sName.trim(), nameAr: sName.trim(), email: sEmail.trim(), password: sPwd })
      if (res.success) {
        toast.success(isAr ? 'تم التسجيل، في انتظار الموافقة' : 'Registered! Awaiting approval.')
        setSignupOpen(false); router.push('/pending-approval')
      } else {
        toast.error(res.error || (isAr ? 'فشل التسجيل' : 'Registration failed'))
      }
    } finally { setSLoading(false) }
  }

  /* ── Change Password (Dummy Implementation for Build) ─────────────────────────── */
  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault()
    toast.info(isAr ? "يرجى التواصل مع الأدمن لتغيير كلمة المرور في هذه النسخة" : "Contact Admin to change password in this version")
    setMustChange(false)
  }

  /* ═════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">

      {/* Lang */}
      <button onClick={toggleLang}
        className="fixed top-4 left-4 px-3 py-1.5 rounded-full border border-teal-300 bg-white/80 text-xs font-bold text-teal-700 hover:bg-teal-50 z-50 shadow-sm">
        {isAr ? 'EN' : 'ع'}
      </button>

      {/* IT Support */}
      <button onClick={() => setItOpen(true)}
        className="fixed top-4 right-4 px-3 py-1.5 rounded-full border border-slate-200 bg-white/80 text-xs font-semibold text-slate-500 hover:bg-slate-50 flex items-center gap-1 shadow-sm z-50">
        <Headphones className="h-3.5 w-3.5" />
        {isAr ? 'الدعم الفني' : 'IT Support'}
      </button>

      <div className="w-full max-w-md space-y-5">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 shadow-lg">
              <Hospital className="h-9 w-9 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-teal-700 dark:text-teal-400">PRO Nurse</h1>
          <p className="text-xs text-slate-500">{isAr ? 'نظام إدارة المستشفيات' : 'Hospital Information System'}</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-teal-500 to-blue-500" />
          <CardHeader className="pb-2 pt-5 text-center">
            <CardTitle className="text-base">{isAr ? 'تسجيل الدخول' : 'Sign In'}</CardTitle>
            <CardDescription className="text-xs">{isAr ? 'اختر طريقة تسجيل الدخول' : 'Choose your sign-in method'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">

            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="w-full grid grid-cols-3 h-9">
                <TabsTrigger value="employee" className="text-xs gap-1">
                  <IdCard className="h-3 w-3" />{isAr ? 'الموظف' : 'Employee'}
                </TabsTrigger>
                <TabsTrigger value="admin" className="text-xs gap-1">
                  <ShieldCheck className="h-3 w-3" />{isAr ? 'الأدمن' : 'Admin'}
                </TabsTrigger>
                <TabsTrigger value="google" className="text-xs gap-1">
                  <GoogleIcon /><span>{isAr ? 'جوجل' : 'Google'}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {tab === 'employee' && (
              <form onSubmit={handleEmployee} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? 'كود الموظف' : 'Employee Code'}</Label>
                  <div className="relative">
                    <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input value={empCode} onChange={e => setEmpCode(e.target.value)}
                      placeholder="ADM001" className="pr-8 h-9 text-sm" dir="ltr" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? 'كلمة المرور' : 'Password'}</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input type={showEmpPwd ? 'text' : 'password'} value={empPwd} onChange={e => setEmpPwd(e.target.value)}
                      placeholder="••••••••" className="pr-8 pl-8 h-9 text-sm" dir="ltr" />
                    <button type="button" onClick={() => setShowEmpPwd(!showEmpPwd)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showEmpPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-9 bg-teal-600 hover:bg-teal-700 text-sm" disabled={empLoading}>
                  {empLoading ? (isAr ? 'جاري التحقق...' : 'Checking...') : (<><LogIn className="h-3.5 w-3.5 mr-1" />{isAr ? 'دخول' : 'Sign In'}</>)}
                </Button>
              </form>
            )}

            {tab === 'admin' && (
              <form onSubmit={handleAdmin} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? 'البريد الإلكتروني' : 'Email'}</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                      placeholder="admin@pronurse.com" className="pr-8 h-9 text-sm" dir="ltr" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{isAr ? 'كلمة المرور' : 'Password'}</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <Input type={showAdminPwd ? 'text' : 'password'} value={adminPwd} onChange={e => setAdminPwd(e.target.value)}
                      placeholder="••••••••" className="pr-8 pl-8 h-9 text-sm" dir="ltr" />
                    <button type="button" onClick={() => setShowAdminPwd(!showAdminPwd)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showAdminPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-sm" disabled={adminLoading}>
                  {adminLoading ? (isAr ? 'جاري التحقق...' : 'Checking...') : (<><ShieldCheck className="h-3.5 w-3.5 mr-1" />{isAr ? 'دخول الأدمن' : 'Admin Sign In'}</>)}
                </Button>
              </form>
            )}

            {tab === 'google' && (
              <div className="space-y-3 pt-1">
                <Button variant="outline" className="w-full h-10 gap-2 text-sm border-2 hover:border-teal-400"
                  onClick={handleGoogle} disabled={gLoading}>
                  {gLoading
                    ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/></svg>{isAr ? 'جاري الاتصال...' : 'Connecting...'}</>
                    : <><GoogleIcon />{isAr ? 'تسجيل الدخول بـ Google' : 'Sign in with Google'}</>}
                </Button>
              </div>
            )}

            <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200" /></div><div className="relative flex justify-center"><span className="bg-white dark:bg-slate-900 px-2 text-xs text-slate-400">{isAr ? 'أو' : 'or'}</span></div></div>
            <Button variant="ghost" className="w-full h-8 text-xs text-teal-600 hover:bg-teal-50" onClick={() => setSignupOpen(true)}>
              <UserPlus className="h-3.5 w-3.5 mr-1" />{isAr ? 'إنشاء حساب جديد' : 'Create New Account'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Change Pwd Dialog */}
      <Dialog open={mustChange} onOpenChange={setMustChange}>
        <DialogContent><DialogHeader>
          <DialogTitle>{isAr ? 'تغيير كلمة المرور' : 'Change Password'}</DialogTitle>
          <DialogDescription>{isAr ? 'يجب تحديث كلمة المرور للمتابعة' : 'Must update password to continue'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleChangePwd} className="space-y-3 pt-2">
          <div className="space-y-1"><Label className="text-xs">{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</Label><Input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="••••••••" dir="ltr" /></div>
          <div className="space-y-1"><Label className="text-xs">{isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}</Label><Input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} placeholder="••••••••" dir="ltr" /></div>
          <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">{isAr ? 'تحديث' : 'Update'}</Button>
        </form></DialogContent>
      </Dialog>

      {/* Signup Dialog */}
      <Dialog open={signupOpen} onOpenChange={setSignupOpen}>
        <DialogContent><DialogHeader>
          <DialogTitle>{isAr ? 'إنشاء حساب جديد' : 'Create New Account'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSignup} className="space-y-3 pt-2">
          <div className="space-y-1"><Label className="text-xs">{isAr ? 'الاسم الكامل' : 'Full Name'}</Label><Input value={sName} onChange={e => setSName(e.target.value)} placeholder={isAr ? 'اسمك الكامل' : 'Your full name'} /></div>
          <div className="space-y-1"><Label className="text-xs">{isAr ? 'البريد الإلكتروني' : 'Email'}</Label><Input type="email" value={sEmail} onChange={e => setSEmail(e.target.value)} placeholder="name@hospital.com" dir="ltr" /></div>
          <div className="space-y-1"><Label className="text-xs">{isAr ? 'كلمة المرور' : 'Password'}</Label><Input type="password" value={sPwd} onChange={e => setSPwd(e.target.value)} placeholder={isAr ? '6 أحرف على الأقل' : 'Min 6 chars'} dir="ltr" /></div>
          <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={sLoading}>
            {sLoading ? (isAr ? 'جاري التسجيل...' : 'Registering...') : (isAr ? 'إرسال الطلب' : 'Submit Request')}
          </Button>
        </form></DialogContent>
      </Dialog>

      {/* IT Support Dialog */}
      <Dialog open={itOpen} onOpenChange={setItOpen}>
        <DialogContent><DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Headphones className="h-5 w-5 text-teal-600" />{isAr ? 'الدعم الفني IT' : 'IT Support'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2 text-center">
            <p className="text-sm">{isAr ? "يرجى مراجعة إعدادات Firebase" : "Please check Firebase settings"}</p>
        </div></DialogContent>
      </Dialog>
    </div>
  )
}
