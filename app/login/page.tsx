'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, Mail, IdCard, LogIn, UserPlus, Headphones, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/lang-context'
import { toast } from 'sonner'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

interface LoginForm {
  code: string
  password: string
}

interface RegistrationForm {
  nameAr: string
  nameEn: string
  email: string
  password: string
  confirmPassword: string
}

export default function LoginPage() {
  const router = useRouter()
  const { login, loginWithEmployeeCode, loginWithGoogle, register, changePassword } = useAuth()
  const { lang, toggleLang } = useLang()
  const isAr = lang === 'ar'
  
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'changePassword'>('login')
  const [activeTab, setActiveTab] = useState<'employee' | 'email' | 'google'>('employee')
  
  // Employee/Email Login
  const [empForm, setEmpForm] = useState<LoginForm>({ code: '', password: '' })
  const [emailForm, setEmailForm] = useState<{ email: string; password: string }>({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [empLoading, setEmpLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  
  // Registration
  const [regForm, setRegForm] = useState<RegistrationForm>({
    nameAr: '',
    nameEn: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [regLoading, setRegLoading] = useState(false)
  
  // Change Password
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [changePwdLoading, setChangePwdLoading] = useState(false)

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!empForm.code.trim() || !empForm.password.trim()) {
      toast.error(isAr ? 'أدخل كود الموظف وكلمة المرور' : 'Enter employee code and password')
      return
    }
    setEmpLoading(true)
    try {
      const res = await loginWithEmployeeCode(empForm.code.trim(), empForm.password.trim())
      if (res.success) {
        toast.success(isAr ? 'مرحباً بك' : 'Welcome!')
        router.push('/dashboard')
      } else {
        toast.error(res.error || (isAr ? 'فشل تسجيل الدخول' : 'Login failed'))
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setEmpLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailForm.email.trim() || !emailForm.password.trim()) {
      toast.error(isAr ? 'أدخل البريد الإلكتروني وكلمة المرور' : 'Enter email and password')
      return
    }
    setEmailLoading(true)
    try {
      const res = await login(emailForm.email.trim(), emailForm.password.trim())
      if (res.success) {
        toast.success(isAr ? 'مرحباً بك' : 'Welcome!')
        router.push('/dashboard')
      } else {
        toast.error(res.error || (isAr ? 'فشل تسجيل الدخول' : 'Login failed'))
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setEmailLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setGoogleLoading(true)
    try {
      const res = await loginWithGoogle()
      if (res.success) {
        if (res.pendingApproval) {
          toast.success(isAr ? 'تم التسجيل بنجاح، بانتظار الموافقة' : 'Registration successful, awaiting approval')
          router.push('/pending-approval')
        } else {
          toast.success(isAr ? 'مرحباً بك' : 'Welcome!')
          router.push('/dashboard')
        }
      } else {
        toast.error(res.error || (isAr ? 'فشلت عملية Google' : 'Google login failed'))
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setGoogleLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regForm.nameAr.trim() || !regForm.nameEn.trim() || !regForm.email.trim() || !regForm.password.trim()) {
      toast.error(isAr ? 'ملء جميع الحقول مطلوب' : 'All fields are required')
      return
    }
    if (regForm.password !== regForm.confirmPassword) {
      toast.error(isAr ? 'كلمات المرور غير متطابقة' : 'Passwords do not match')
      return
    }
    if (regForm.password.length < 8) {
      toast.error(isAr ? 'كلمة المرور 8 أحرف على الأقل' : 'Password must be at least 8 characters')
      return
    }
    setRegLoading(true)
    try {
      const res = await register({
        name: regForm.nameEn,
        nameAr: regForm.nameAr,
        email: regForm.email.trim(),
        password: regForm.password,
      })
      if (res.success) {
        toast.success(isAr ? 'تم التسجيل بنجاح، بانتظار الموافقة' : 'Registration successful, awaiting approval')
        router.push('/pending-approval')
      } else {
        toast.error(res.error || (isAr ? 'فشل التسجيل' : 'Registration failed'))
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setRegLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword.trim() || !confirmNewPassword.trim()) {
      toast.error(isAr ? 'أدخل كلمة المرور الجديدة' : 'Enter new password')
      return
    }
    if (newPassword !== confirmNewPassword) {
      toast.error(isAr ? 'كلمات المرور غير متطابقة' : 'Passwords do not match')
      return
    }
    setChangePwdLoading(true)
    try {
      const res = await changePassword(newPassword)
      if (res.success) {
        toast.success(isAr ? 'تم تغيير كلمة المرور' : 'Password changed')
        router.push('/dashboard')
      } else {
        toast.error(res.error || (isAr ? 'فشل تغيير كلمة المرور' : 'Password change failed'))
      }
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setChangePwdLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/10 transition-colors duration-300 ${isAr ? 'rtl' : 'ltr'}`}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-lg font-bold">P</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">PRO Nurse</h1>
          </div>
          <p className={`text-sm text-muted-foreground ${isAr ? '' : ''}`}>
            {isAr ? 'نظام إدارة المستشفيات المتقدم' : 'Advanced Hospital Management System'}
          </p>
        </div>

        {/* Language Toggle */}
        <div className="flex justify-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLang}
            className="text-xs"
          >
            {lang === 'ar' ? 'English' : 'العربية'}
          </Button>
        </div>

        {/* Main Content */}
        {view === 'login' && (
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-2 border-b">
              <CardTitle className={isAr ? 'text-right' : ''}>
                {isAr ? 'تسجيل الدخول' : 'Login'}
              </CardTitle>
              <CardDescription className={isAr ? 'text-right' : ''}>
                {isAr ? 'اختر طريقة الدخول' : 'Choose your login method'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="employee" className="text-xs sm:text-sm">
                    {isAr ? 'كود الموظف' : 'Employee Code'}
                  </TabsTrigger>
                  <TabsTrigger value="email" className="text-xs sm:text-sm">
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </TabsTrigger>
                  <TabsTrigger value="google" className="text-xs sm:text-sm">
                    Google
                  </TabsTrigger>
                </TabsList>

                {/* Employee Tab */}
                <TabsContent value="employee" className="space-y-4">
                  <form onSubmit={handleEmployeeLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="emp-code" className={isAr ? 'text-right block' : ''}>
                        {isAr ? 'كود الموظف' : 'Employee Code'}
                      </Label>
                      <Input
                        id="emp-code"
                        placeholder={isAr ? 'مثل: EMP001' : 'e.g., EMP001'}
                        value={empForm.code}
                        onChange={(e) => setEmpForm({ ...empForm, code: e.target.value })}
                        dir={isAr ? 'rtl' : 'ltr'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emp-pwd" className={isAr ? 'text-right block' : ''}>
                        {isAr ? 'كلمة المرور' : 'Password'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="emp-pwd"
                          type={showPwd ? 'text' : 'password'}
                          placeholder={isAr ? 'أدخل كلمة المرور' : 'Enter password'}
                          value={empForm.password}
                          onChange={(e) => setEmpForm({ ...empForm, password: e.target.value })}
                          dir={isAr ? 'rtl' : 'ltr'}
                          className={isAr ? 'pr-10' : 'pl-10'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors ${isAr ? 'left-3' : 'right-3'}`}
                        >
                          {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" disabled={empLoading} className="w-full gap-2">
                      {empLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isAr ? 'دخول' : 'Login'}
                    </Button>
                  </form>
                </TabsContent>

                {/* Email Tab */}
                <TabsContent value="email" className="space-y-4">
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className={isAr ? 'text-right block' : ''}>
                        {isAr ? 'البريد الإلكتروني' : 'Email'}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder={isAr ? 'name@example.com' : 'name@example.com'}
                        value={emailForm.email}
                        onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                        dir={isAr ? 'rtl' : 'ltr'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email-pwd" className={isAr ? 'text-right block' : ''}>
                        {isAr ? 'كلمة المرور' : 'Password'}
                      </Label>
                      <div className="relative">
                        <Input
                          id="email-pwd"
                          type={showPwd ? 'text' : 'password'}
                          placeholder={isAr ? 'أدخل كلمة المرور' : 'Enter password'}
                          value={emailForm.password}
                          onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                          dir={isAr ? 'rtl' : 'ltr'}
                          className={isAr ? 'pr-10' : 'pl-10'}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors ${isAr ? 'left-3' : 'right-3'}`}
                        >
                          {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" disabled={emailLoading} className="w-full gap-2">
                      {emailLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isAr ? 'دخول' : 'Login'}
                    </Button>
                  </form>
                </TabsContent>

                {/* Google Tab */}
                <TabsContent value="google">
                  <Button
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    {googleLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                    <GoogleIcon />
                    {isAr ? 'دخول عبر Google' : 'Sign in with Google'}
                  </Button>
                </TabsContent>
              </Tabs>

              {/* Bottom Actions */}
              <div className="mt-6 space-y-3 border-t pt-4">
                <Button
                  variant="ghost"
                  className="w-full text-sm gap-2"
                  onClick={() => setView('register')}
                >
                  <UserPlus className="h-4 w-4" />
                  {isAr ? 'إنشاء حساب جديد' : 'Create New Account'}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full text-sm text-muted-foreground"
                  onClick={() => setView('forgot')}
                >
                  {isAr ? 'نسيت كلمة المرور؟' : 'Forgot password?'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Register View */}
        {view === 'register' && (
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-2 border-b">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setView('login')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className={isAr ? 'text-right' : ''}>
                    {isAr ? 'إنشاء حساب' : 'Create Account'}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name-ar" className={isAr ? 'text-right block' : ''}>
                    {isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}
                  </Label>
                  <Input
                    id="name-ar"
                    placeholder={isAr ? 'أدخل اسمك بالعربية' : 'Enter your name in Arabic'}
                    value={regForm.nameAr}
                    onChange={(e) => setRegForm({ ...regForm, nameAr: e.target.value })}
                    dir="rtl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name-en" className={isAr ? 'text-right block' : ''}>
                    {isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}
                  </Label>
                  <Input
                    id="name-en"
                    placeholder="Enter your name in English"
                    value={regForm.nameEn}
                    onChange={(e) => setRegForm({ ...regForm, nameEn: e.target.value })}
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email" className={isAr ? 'text-right block' : ''}>
                    {isAr ? 'البريد الإلكتروني' : 'Email'}
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="name@example.com"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    dir={isAr ? 'rtl' : 'ltr'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-pwd" className={isAr ? 'text-right block' : ''}>
                    {isAr ? 'كلمة المرور' : 'Password'}
                  </Label>
                  <Input
                    id="reg-pwd"
                    type="password"
                    placeholder={isAr ? 'كلمة قوية (8 أحرف على الأقل)' : 'Strong password (min 8 chars)'}
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    dir={isAr ? 'rtl' : 'ltr'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-confirm" className={isAr ? 'text-right block' : ''}>
                    {isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                  </Label>
                  <Input
                    id="reg-confirm"
                    type="password"
                    placeholder={isAr ? 'أعد إدخال كلمة المرور' : 'Re-enter password'}
                    value={regForm.confirmPassword}
                    onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                    dir={isAr ? 'rtl' : 'ltr'}
                  />
                </div>

                <Button type="submit" disabled={regLoading} className="w-full gap-2">
                  {regLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isAr ? 'إنشاء الحساب' : 'Create Account'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Forgot Password View */}
        {view === 'forgot' && (
          <Card className="shadow-lg border-0">
            <CardHeader className="space-y-2 border-b">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setView('login')}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <CardTitle className={isAr ? 'text-right' : ''}>
                    {isAr ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 text-center">
                <p className={`text-sm text-muted-foreground ${isAr ? '' : ''}`}>
                  {isAr 
                    ? 'يرجى التواصل مع قسم تكنولوجيا المعلومات لإعادة تعيين كلمة المرور'
                    : 'Please contact the IT department to reset your password'
                  }
                </p>
                <Button variant="outline" className="w-full gap-2">
                  <Headphones className="h-4 w-4" />
                  {isAr ? 'التواصل مع الدعم' : 'Contact Support'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className={`text-xs text-center text-muted-foreground mt-6 ${isAr ? '' : ''}`}>
          {isAr
            ? 'جميع الحقوق محفوظة © 2024 PRO Nurse'
            : '© 2024 PRO Nurse. All rights reserved.'}
        </p>
      </div>
    </div>
  )
}
