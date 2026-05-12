'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'
import { createDocumentWithId } from '@/lib/firebase-services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Hospital } from 'lucide-react'
import { toast } from 'sonner'

export default function InitPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@pronurse.com')
  const [password, setPassword] = useState('Admin@1234')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const auth = getFirebaseAuth()
      
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid

      // 2. Create Firestore document
      const userData = {
        id: uid,
        name: 'Admin',
        nameAr: 'الإدارة',
        email: email,
        employeeCode: 'ADM001',
        role: 'super_admin',
        roleId: 'super_admin',
        department: 'الإدارة',
        departmentId: 'admin',
        status: 'active',
        phone: '',
        hireDate: new Date().toISOString(),
        mustChangePassword: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await createDocumentWithId('users', uid, userData)

      toast.success('تم إنشاء حساب الإدارة بنجاح!')
      
      // 3. Redirect to login
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      console.error('Error:', err)
      setError(err.message || 'حدث خطأ')
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 shadow-lg">
              <Hospital className="h-9 w-9 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-teal-700 dark:text-teal-400">PRO Nurse</h1>
          <p className="text-sm text-muted-foreground">نظام إدارة المستشفيات - Hospital Management System</p>
        </div>

        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-center">تهيئة النظام الأولي</CardTitle>
            <p className="text-sm text-muted-foreground text-center mt-2">إنشاء حساب الإدارة الأول</p>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  placeholder="admin@pronurse.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-semibold"
                disabled={loading}
              >
                {loading ? 'جاري الإنشاء...' : 'إنشاء حساب الإدارة'}
              </Button>
            </form>

            <Alert>
              <AlertDescription className="text-sm">
                سيتم إنشاء حساب إدارة جديد في Firebase وتسجيله في قاعدة البيانات. بعدها يمكنك تسجيل الدخول مباشرة.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          © 2024 PRO Nurse. جميع الحقوق محفوظة.
        </p>
      </div>
    </div>
  )
}
