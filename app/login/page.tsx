'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Eye, EyeOff, Lock, IdCard, Hospital, LogIn,
  Mail, UserPlus, Headphones, ShieldCheck, KeyRound,
  Phone, Building2, Loader2, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/lang-context'
import { toast } from 'sonner'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5 flex-shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

const DEPARTMENTS = [
  { value: 'admin', labelAr: 'الإدارة', labelEn: 'Administration' },
  { value: 'icu', labelAr: 'العناية المركزة', labelEn: 'ICU' },
  { value: 'er', labelAr: 'الطوارئ', labelEn: 'Emergency' },
  { value: 'internal', labelAr: 'الباطنية', labelEn: 'Internal Medicine' },
  { value: 'surgery', labelAr: 'الجراحة', labelEn: 'Surgery' },
  { value: 'pediatrics', labelAr: 'الأطفال', labelEn: 'Pediatrics' },
  { value: 'obgyn', labelAr: 'النساء والولادة', labelEn: 'OB/GYN' },
  { value: 'orthopedics', labelAr: 'العظام', labelEn: 'Orthopedics' },
  { value: 'cardiology', labelAr: 'القلب', labelEn: 'Cardiology' },
  { value: 'nicu', labelAr: 'حديثي الولادة', labelEn: 'NICU' },
]

export default function LoginPage() {
  const router = useRouter()
  const { login, loginWithGoogle, loginWithEmployeeCode, register, resetPassword, isAuthenticated, loading: authLoading } = useAuth()
  const { lang, toggleLang } = useLang()
  const isAr = lang === 'ar'

  const [tab, setTab] = useState<'email' | 'employee' | 'google'>('email')

  // Email tab
  const [email, setEmail] = useState('')
  const [emailPwd, setEmailPwd] = useState('')
  const [showEmailPwd, setShowEmailPwd] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)

  // Employee tab
  const [empCode, setEmpCode] = useState('')
  const [empPwd, setEmpPwd] = useState('')
  const [showEmpPwd, setShowEmpPwd] = useState(false)
  const [empLoading, setEmpLoading] = useState(false)

  // Google
  const [gLoading, setGLoading] = useState(false)

  // Signup dialog
  const [signupOpen, setSignupOpen] = useState(false)
  const [sNameAr, setSNameAr] = useState('')
  const [sNameEn, setSNameEn] = useState('')
  const [sEmail, setSEmail] = useState('')
  const [sPhone, setSPhone] = useState('')
  const [sDept, setSDept] = useState('')
  const [sEmpCode, setSEmpCode] = useState('')
  const [sPwd, setSPwd] = useState('')
  const [sConfirmPwd, setSConfirmPwd] = useState('')
  const [sLoading, setSLoading] = useState(false)

  // Forgot password
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  // IT support
  const [itOpen, setItOpen] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [authLoading, isAuthenticated, router])

  // Email Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !emailPwd.trim()) {
      toast.error(isAr ? 'أدخل البريد الإلكتروني وكلمة المرور' : 'Enter email and password')
      return
    }
    setEmailLoading(true)
    try {
      const res = await login(email.trim(), emailPwd.trim())
      if (res.success) {
        toast.success(isAr ? 'مرحباً بك!' : 'Welcome back!')
        router.push('/dashboard')
      } else if (res.pendingApproval) {
        toast.info(isAr ? 'حسابك في انتظار الموافقة' : 'Your account is pending approval')
        router.push('/pending-approval')
      } else {
        toast.error(isAr ? 'فشل تسجيل الدخول' : 'Login failed', { description: res.error })
      }
    } finally {
      setEmailLoading(false)
    }
  }

  // Employee Code Login
  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empCode.trim() || !empPwd.trim()) {
      toast.error(isAr ? 'أدخل كود الموظف وكلمة المرور' : 'Enter employee code and password')
      return
    }
    setEmpLoading(true)
    try {
      const res = await loginWithEmployeeCode(empCode.trim(), empPwd.trim())
      if (res.success) {
        toast.success(isAr ? 'مرحباً بك!' : 'Welcome back!')
        router.push('/dashboard')
      } else if (res.pendingApproval) {
        toast.info(isAr ? 'حسابك في انتظار الموافقة' : 'Your account is pending approval')
        router.push('/pending-approval')
      } else {
        toast.error(isAr ? 'فشل تسجيل الدخول' : 'Login failed', { description: res.error })
      }
    } finally {
      setEmpLoading(false)
    }
  }

  // Google Sign-In
  const handleGoogle = async () => {
    setGLoading(true)
    try {
      const res = await loginWithGoogle()
      if (res.success) {
        toast.success(isAr ? 'تم تسجيل الدخول بنجاح!' : 'Signed in successfully!')
        router.push('/dashboard')
      } else if (res.pendingApproval) {
        toast.info(
          isAr ? 'في انتظار موافقة الإدارة' : 'Awaiting admin approval',
          { description: isAr ? 'سيتم إشعارك عند تفعيل الحساب' : "You will be notified when approved" }
        )
        router.push('/pending-approval')
      } else {
        toast.error(isAr ? 'فشل تسجيل الدخول بـ Google' : 'Google sign-in failed', { description: res.error })
      }
    } catch (err: unknown) {
      toast.error(isAr ? 'خطأ في Google' : 'Google error', {
        description: err instanceof Error ? err.message : '',
      })
    } finally {
      setGLoading(false)
    }
  }

  // Signup
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!sNameAr.trim() || !sEmail.trim() || sPwd.length < 6) {
      toast.error(isAr ? 'أدخل جميع البيانات المطلوبة (كلمة المرور 6 أحرف على الأقل)' : 'Fill all required fields (password min 6 chars)')
      return
    }
    
    if (sPwd !== sConfirmPwd) {
      toast.error(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match')
      return
    }
    
    setSLoading(true)
    try {
      const res = await register({
        name: sNameEn.trim() || sNameAr.trim(),
        nameAr: sNameAr.trim(),
        email: sEmail.trim(),
        password: sPwd,
        phone: sPhone.trim(),
        employeeCode: sEmpCode.trim().toUpperCase(),
        department: sDept,
      })
      
      if (res.success) {
        toast.success(isAr ? 'تم التسجيل بنجاح! في انتظار الموافقة' : 'Registered! Awaiting approval.')
        setSignupOpen(false)
        // Reset form
        setSNameAr('')
        setSNameEn('')
        setSEmail('')
        setSPhone('')
        setSDept('')
        setSEmpCode('')
        setSPwd('')
        setSConfirmPwd('')
        router.push('/pending-approval')
      } else {
        toast.error(res.error || (isAr ? 'فشل التسجيل' : 'Registration failed'))
      }
    } finally {
      setSLoading(false)
    }
  }

  // Forgot Password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) {
      toast.error(isAr ? 'أدخل البريد الإلكتروني' : 'Enter your email')
      return
    }
    
    setForgotLoading(true)
    try {
      const res = await resetPassword(forgotEmail.trim())
      if (res.success) {
        toast.success(isAr ? 'تم إرسال رابط إعادة تعيين كلمة المرور' : 'Password reset link sent!')
        setForgotOpen(false)
        setForgotEmail('')
      } else {
        toast.error(res.error || (isAr ? 'فشل إرسال الرابط' : 'Failed to send reset link'))
      }
    } finally {
      setForgotLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      {/* Language Toggle */}
      <button
        onClick={toggleLang}
        className="fixed top-4 left-4 px-3 py-1.5 rounded-full border border-teal-300 bg-white/80 dark:bg-slate-800/80 text-xs font-bold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-700 z-50 shadow-sm backdrop-blur-sm"
      >
        {isAr ? 'EN' : 'ع'}
      </button>

      {/* IT Support */}
      <button
        onClick={() => setItOpen(true)}
        className="fixed top-4 right-4 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1 shadow-sm z-50 backdrop-blur-sm"
      >
        <Headphones className="h-3.5 w-3.5" />
        {isAr ? 'الدعم الفني' : 'IT Support'}
      </button>

      <div className="w-full max-w-md space-y-5">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg shadow-teal-500/20">
              <Hospital className="h-9 w-9 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-teal-700 dark:text-teal-400">PRO Nurse</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isAr ? 'نظام إدارة المستشفيات المتكامل' : 'Hospital Information System'}
          </p>
        </div>

        {/* Login Card */}
        <Card className="shadow-xl border-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-teal-500 to-blue-500" />
          <CardHeader className="pb-2 pt-5 text-center">
            <CardTitle className="text-lg">{isAr ? 'تسجيل الدخول' : 'Sign In'}</CardTitle>
            <CardDescription className="text-sm">{isAr ? 'اختر طريقة تسجيل الدخول' : 'Choose your sign-in method'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            {/* Tabs */}
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="w-full grid grid-cols-3 h-10">
                <TabsTrigger value="email" className="text-xs gap-1.5 data-[state=active]:bg-teal-100 dark:data-[state=active]:bg-teal-900/50">
                  <Mail className="h-3.5 w-3.5" />
                  {isAr ? 'البريد' : 'Email'}
                </TabsTrigger>
                <TabsTrigger value="employee" className="text-xs gap-1.5 data-[state=active]:bg-teal-100 dark:data-[state=active]:bg-teal-900/50">
                  <IdCard className="h-3.5 w-3.5" />
                  {isAr ? 'كود الموظف' : 'Employee'}
                </TabsTrigger>
                <TabsTrigger value="google" className="text-xs gap-1.5 data-[state=active]:bg-teal-100 dark:data-[state=active]:bg-teal-900/50">
                  <GoogleIcon />
                  <span>Google</span>
                </TabsTrigger>
              </TabsList>

              {/* Email Login Tab */}
              <TabsContent value="email" className="mt-4">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">{isAr ? 'البريد الإلكتروني' : 'Email'}</Label>
                    <div className="relative">
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="admin@pronurse.com"
                        className="pr-10 h-10"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{isAr ? 'كلمة المرور' : 'Password'}</Label>
                      <button
                        type="button"
                        onClick={() => setForgotOpen(true)}
                        className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400"
                      >
                        {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type={showEmailPwd ? 'text' : 'password'}
                        value={emailPwd}
                        onChange={e => setEmailPwd(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10 pl-10 h-10"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmailPwd(!showEmailPwd)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showEmailPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-10 bg-teal-600 hover:bg-teal-700 text-sm gap-2" disabled={emailLoading}>
                    {emailLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />{isAr ? 'جاري التحقق...' : 'Checking...'}</>
                    ) : (
                      <><LogIn className="h-4 w-4" />{isAr ? 'تسجيل الدخول' : 'Sign In'}</>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Employee Code Tab */}
              <TabsContent value="employee" className="mt-4">
                <form onSubmit={handleEmployeeLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">{isAr ? 'كود الموظف' : 'Employee Code'}</Label>
                    <div className="relative">
                      <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        value={empCode}
                        onChange={e => setEmpCode(e.target.value.toUpperCase())}
                        placeholder="ADM001"
                        className="pr-10 h-10 uppercase"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{isAr ? 'كلمة المرور' : 'Password'}</Label>
                      <button
                        type="button"
                        onClick={() => setForgotOpen(true)}
                        className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400"
                      >
                        {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        type={showEmpPwd ? 'text' : 'password'}
                        value={empPwd}
                        onChange={e => setEmpPwd(e.target.value)}
                        placeholder="••••••••"
                        className="pr-10 pl-10 h-10"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmpPwd(!showEmpPwd)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showEmpPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-sm gap-2" disabled={empLoading}>
                    {empLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" />{isAr ? 'جاري التحقق...' : 'Checking...'}</>
                    ) : (
                      <><ShieldCheck className="h-4 w-4" />{isAr ? 'دخول بكود الموظف' : 'Sign In with Code'}</>
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Google Tab */}
              <TabsContent value="google" className="mt-4">
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    className="w-full h-12 gap-3 text-sm border-2 hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30"
                    onClick={handleGoogle}
                    disabled={gLoading}
                  >
                    {gLoading ? (
                      <><Loader2 className="h-5 w-5 animate-spin" />{isAr ? 'جاري الاتصال...' : 'Connecting...'}</>
                    ) : (
                      <><GoogleIcon />{isAr ? 'تسجيل الدخول بحساب Google' : 'Sign in with Google'}</>
                    )}
                  </Button>
                  <div className="bg-blue-50 dark:bg-blue-950/50 rounded-lg p-3 text-sm text-blue-700 dark:text-blue-300">
                    <p className="flex items-start gap-2">
                      <ShieldCheck className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>
                        {isAr
                          ? 'موظف جديد؟ سيتم إنشاء حسابك تلقائياً وسيكون بانتظار موافقة المدير.'
                          : 'New employee? Your account will be created automatically and will await admin approval.'}
                      </span>
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400">
                  {isAr ? 'أو' : 'or'}
                </span>
              </div>
            </div>

            {/* Create Account Button */}
            <Button
              variant="outline"
              className="w-full h-10 text-sm text-teal-600 hover:text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/30 gap-2"
              onClick={() => setSignupOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              {isAr ? 'إنشاء حساب جديد' : 'Create New Account'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Signup Dialog */}
      <Dialog open={signupOpen} onOpenChange={setSignupOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-teal-600" />
              {isAr ? 'إنشاء حساب جديد' : 'Create New Account'}
            </DialogTitle>
            <DialogDescription>
              {isAr ? 'سيتم مراجعة طلبك من قِبل الإدارة قبل تفعيل الحساب' : 'Your request will be reviewed by admin before activation'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignup} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? 'الاسم بالعربي *' : 'Name (Arabic) *'}</Label>
                <Input
                  value={sNameAr}
                  onChange={e => setSNameAr(e.target.value)}
                  placeholder="أحمد محمد"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? 'الاسم بالإنجليزي' : 'Name (English)'}</Label>
                <Input
                  value={sNameEn}
                  onChange={e => setSNameEn(e.target.value)}
                  placeholder="Ahmed Mohammed"
                  dir="ltr"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">{isAr ? 'البريد الإلكتروني *' : 'Email *'}</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  value={sEmail}
                  onChange={e => setSEmail(e.target.value)}
                  placeholder="name@hospital.com"
                  className="pr-10"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? 'رقم الجوال' : 'Phone (Optional)'}</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="tel"
                    value={sPhone}
                    onChange={e => setSPhone(e.target.value)}
                    placeholder="05XXXXXXXX"
                    className="pr-10"
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? 'كود الموظف' : 'Employee Code'}</Label>
                <div className="relative">
                  <IdCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    value={sEmpCode}
                    onChange={e => setSEmpCode(e.target.value.toUpperCase())}
                    placeholder="EMP001"
                    className="pr-10 uppercase"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">{isAr ? 'القسم' : 'Department'}</Label>
              <Select value={sDept} onValueChange={setSDept}>
                <SelectTrigger>
                  <Building2 className="h-4 w-4 text-slate-400 ml-2" />
                  <SelectValue placeholder={isAr ? 'اختر القسم' : 'Select department'} />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept.value} value={dept.value}>
                      {isAr ? dept.labelAr : dept.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? 'كلمة المرور *' : 'Password *'}</Label>
                <Input
                  type="password"
                  value={sPwd}
                  onChange={e => setSPwd(e.target.value)}
                  placeholder={isAr ? '6 أحرف على الأقل' : 'Min 6 characters'}
                  dir="ltr"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">{isAr ? 'تأكيد كلمة المرور *' : 'Confirm Password *'}</Label>
                <Input
                  type="password"
                  value={sConfirmPwd}
                  onChange={e => setSConfirmPwd(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSignupOpen(false)}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-teal-600 hover:bg-teal-700 gap-2"
                disabled={sLoading}
              >
                {sLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{isAr ? 'جاري التسجيل...' : 'Registering...'}</>
                ) : (
                  <><ArrowRight className="h-4 w-4" />{isAr ? 'إرسال الطلب' : 'Submit Request'}</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-teal-600" />
              {isAr ? 'استعادة كلمة المرور' : 'Reset Password'}
            </DialogTitle>
            <DialogDescription>
              {isAr ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور' : 'Enter your email and we will send you a password reset link'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label className="text-sm">{isAr ? 'البريد الإلكتروني' : 'Email'}</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="email"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="name@hospital.com"
                  className="pr-10"
                  dir="ltr"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setForgotOpen(false)}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-teal-600 hover:bg-teal-700 gap-2"
                disabled={forgotLoading}
              >
                {forgotLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{isAr ? 'جاري الإرسال...' : 'Sending...'}</>
                ) : (
                  <><Mail className="h-4 w-4" />{isAr ? 'إرسال الرابط' : 'Send Link'}</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* IT Support Dialog */}
      <Dialog open={itOpen} onOpenChange={setItOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Headphones className="h-5 w-5 text-teal-600" />
              {isAr ? 'الدعم الفني IT' : 'IT Support'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-teal-50 dark:bg-teal-950/50 rounded-lg p-4 space-y-3">
              <p className="font-semibold text-teal-700 dark:text-teal-400">
                {isAr ? 'بيانات المدير الافتراضي:' : 'Default Admin Credentials:'}
              </p>
              <div className="space-y-2 text-sm">
                <p dir="ltr" className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Email:</span>
                  <strong className="font-mono">admin@pronurse.com</strong>
                </p>
                <p dir="ltr" className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Password:</span>
                  <strong className="font-mono">Admin@1234</strong>
                </p>
                <p dir="ltr" className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Employee Code:</span>
                  <strong className="font-mono">ADM001</strong>
                </p>
              </div>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/50 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-300">
              <p>
                {isAr
                  ? 'إذا لم يكن المدير موجوداً بعد، يرجى تشغيل سكربت إنشاء المدير من لوحة التحكم في Vercel.'
                  : 'If admin does not exist yet, please run the admin seed script from Vercel dashboard.'}
              </p>
            </div>
            <div className="text-center text-sm text-slate-500">
              <p>{isAr ? 'للدعم الفني تواصل عبر:' : 'For technical support:'}</p>
              <p className="font-medium mt-1" dir="ltr">support@pronurse.com</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
