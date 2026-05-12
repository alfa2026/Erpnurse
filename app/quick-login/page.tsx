'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Hospital, AlertCircle, CheckCircle } from 'lucide-react'
import { useLang } from '@/contexts/lang-context'
import { toast } from 'sonner'

export default function QuickLoginPage() {
  const router = useRouter()
  const { lang, toggleLang } = useLang()
  const isAr = lang === 'ar'
  const [email, setEmail] = useState('admin@pronurse.com')
  const [password, setPassword] = useState('Admin@1234')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Demo users - للاختبار السريع
    const demoUsers = [
      { email: 'admin@pronurse.com', password: 'Admin@1234', role: 'super_admin', name: 'Ahmed Admin' },
      { email: 'nurse@pronurse.com', password: 'Nurse@1234', role: 'nurse', name: 'Sara Nurse' },
      { email: 'doctor@pronurse.com', password: 'Doctor@1234', role: 'doctor', name: 'Mohammed Doctor' },
    ]

    // Check if user exists in demo users
    const user = demoUsers.find(u => u.email === email && u.password === password)
    
    if (user) {
      // Save to localStorage
      localStorage.setItem('pronurse_user', JSON.stringify({
        id: email,
        name: user.name,
        email: user.email,
        role: user.role,
        status: 'active'
      }))
      localStorage.setItem('pronurse_auth', 'true')
      
      toast.success(isAr ? 'تم تسجيل الدخول بنجاح' : 'Login successful')
      router.push('/dashboard')
    } else {
      toast.error(isAr ? 'بيانات غير صحيحة' : 'Invalid credentials')
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <button
        onClick={toggleLang}
        className="fixed top-6 right-6 px-4 py-2 rounded-lg border border-teal-300 bg-white/90 dark:bg-slate-800/90 text-sm font-semibold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-slate-700 transition-all shadow-sm z-50"
      >
        {isAr ? 'EN' : 'العربية'}
      </button>

      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-600 to-teal-700 shadow-xl">
              <Hospital className="h-11 w-11 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-teal-700 dark:text-teal-400">PRO Nurse</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr ? 'نظام إدارة المستشفيات' : 'Hospital Management System'}
            </p>
          </div>
        </div>

        {/* Demo Alert */}
        <Alert className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-700 dark:text-blue-300 ml-2">
            {isAr 
              ? 'وضع تجريبي - استخدم البيانات أدناه'
              : 'Demo Mode - Use credentials below'}
          </AlertDescription>
        </Alert>

        {/* Login Card */}
        <Card className="shadow-xl border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-center">
              {isAr ? 'تسجيل الدخول' : 'Login'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isAr ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isAr ? 'كلمة المرور' : 'Password'}
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-10 font-semibold"
                disabled={loading}
              >
                {loading ? (isAr ? 'جاري...' : 'Loading...') : (isAr ? 'دخول' : 'Login')}
              </Button>
            </form>

            {/* Demo Users List */}
            <div className="mt-6 pt-6 border-t space-y-3">
              <p className="text-xs font-bold uppercase text-muted-foreground">
                {isAr ? 'حسابات تجريبية' : 'Demo Accounts'}
              </p>
              <div className="space-y-2">
                {[
                  { email: 'admin@pronurse.com', pwd: 'Admin@1234', role: 'Admin' },
                  { email: 'nurse@pronurse.com', pwd: 'Nurse@1234', role: 'Nurse' },
                  { email: 'doctor@pronurse.com', pwd: 'Doctor@1234', role: 'Doctor' },
                ].map((item, i) => (
                  <div key={i} className="p-2 bg-slate-50 dark:bg-slate-800 rounded text-xs">
                    <div className="font-mono">{item.email}</div>
                    <div className="text-muted-foreground font-mono">{item.pwd}</div>
                    <div className="text-teal-600 dark:text-teal-400 font-medium">{item.role}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Note */}
        <Alert className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-700 dark:text-green-300 ml-2 text-sm">
            {isAr
              ? 'هذا نسخة تجريبية للاختبار السريع'
              : 'This is a demo version for quick testing'}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
