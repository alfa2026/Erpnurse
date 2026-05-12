'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/auth-context'
import { useLang } from '@/contexts/lang-context'
import { toast } from 'sonner'

interface RegisterForm {
  nameAr: string
  nameEn: string
  email: string
  password: string
  confirmPassword: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuth()
  const { lang, toggleLang } = useLang()
  const isAr = lang === 'ar'

  const [form, setForm] = useState<RegisterForm>({
    nameAr: '',
    nameEn: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  // حساب قوة كلمة المرور
  const calculatePasswordStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++
    return strength
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pwd = e.target.value
    setForm(prev => ({ ...prev, password: pwd }))
    setPasswordStrength(calculatePasswordStrength(pwd))
  }

  const validateForm = () => {
    if (!form.nameAr.trim()) {
      toast.error(isAr ? 'أدخل الاسم بالعربية' : 'Enter Arabic name')
      return false
    }
    if (!form.nameEn.trim()) {
      toast.error(isAr ? 'أدخل الاسم بالإنجليزية' : 'Enter English name')
      return false
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error(isAr ? 'أدخل بريداً إلكترونياً صحيحاً' : 'Enter a valid email')
      return false
    }
    if (form.password.length < 8) {
      toast.error(isAr ? 'كلمة المرور 8 أحرف على الأقل' : 'Password must be at least 8 characters')
      return false
    }
    if (form.password !== form.confirmPassword) {
      toast.error(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match')
      return false
    }
    return true
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)
      const res = await register({
        name: form.nameEn,
        nameAr: form.nameAr,
        email: form.email,
        password: form.password,
      })

      if (res.success) {
        toast.success(isAr ? 'تم تسجيلك بنجاح! جاري توجيهك...' : 'Registration successful! Redirecting...')
        setTimeout(() => {
          router.push('/pending-approval')
        }, 1500)
      } else {
        toast.error(res.error || (isAr ? 'فشل التسجيل' : 'Registration failed'))
      }
    } catch (err: any) {
      toast.error(err.message || (isAr ? 'خطأ' : 'Error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/10 transition-colors duration-300 ${isAr ? 'rtl' : 'ltr'}`}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-bold">P</span>
            </div>
            <h1 className="text-3xl font-bold text-foreground">PRO Nurse</h1>
          </div>
          <p className="text-sm text-muted-foreground">
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

        {/* Main Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-2 border-b">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push('/login')}
                className="h-8 w-8"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <CardTitle className={isAr ? 'text-right' : ''}>
                  {isAr ? 'إنشاء حساب جديد' : 'Create New Account'}
                </CardTitle>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Arabic Name */}
              <div className="space-y-2">
                <Label className={isAr ? 'text-right block' : ''}>
                  {isAr ? 'الاسم بالعربية' : 'Arabic Name'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder={isAr ? 'أحمد محمد' : ''}
                  value={form.nameAr}
                  onChange={(e) => setForm(prev => ({ ...prev, nameAr: e.target.value }))}
                  disabled={loading}
                  className={isAr ? 'text-right' : ''}
                />
              </div>

              {/* English Name */}
              <div className="space-y-2">
                <Label className={isAr ? 'text-right block' : ''}>
                  {isAr ? 'الاسم بالإنجليزية' : 'English Name'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  placeholder="Ahmed Mohammed"
                  value={form.nameEn}
                  onChange={(e) => setForm(prev => ({ ...prev, nameEn: e.target.value }))}
                  disabled={loading}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className={isAr ? 'text-right block' : ''}>
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'} <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label className={isAr ? 'text-right block' : ''}>
                  {isAr ? 'كلمة المرور' : 'Password'} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isAr ? 'الحد الأدنى 8 أحرف' : 'Min 8 characters'}
                    value={form.password}
                    onChange={handlePasswordChange}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Strength */}
                {form.password && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i <= passwordStrength
                              ? i <= 2
                                ? 'bg-red-500'
                                : i <= 3
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {passwordStrength <= 2
                        ? (isAr ? 'كلمة مرور ضعيفة' : 'Weak password')
                        : passwordStrength === 3
                        ? (isAr ? 'كلمة مرور متوسطة' : 'Medium password')
                        : (isAr ? 'كلمة مرور قوية' : 'Strong password')}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label className={isAr ? 'text-right block' : ''}>
                  {isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'} <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder={isAr ? 'أعد كتابة كلمة المرور' : 'Retype password'}
                    value={form.confirmPassword}
                    onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Match indicator */}
                {form.confirmPassword && (
                  <div className="flex items-center gap-2 text-sm">
                    {form.password === form.confirmPassword ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-green-600 dark:text-green-400">
                          {isAr ? 'كلمات المرور متطابقة' : 'Passwords match'}
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <span className="text-red-600 dark:text-red-400">
                          {isAr ? 'كلمات المرور غير متطابقة' : 'Passwords do not match'}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Info Alert */}
              <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 dark:text-blue-300 text-sm">
                  {isAr
                    ? 'بعد التسجيل، سيكون حسابك في انتظار الموافقة من قبل الإدارة'
                    : 'After registration, your account will await admin approval'}
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 font-semibold text-base"
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isAr ? 'إنشاء الحساب' : 'Create Account'}
              </Button>

              {/* Login Link */}
              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  {isAr ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
                </span>
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary hover:text-primary/80"
                  onClick={() => router.push('/login')}
                >
                  {isAr ? 'تسجيل الدخول' : 'Login'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

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
