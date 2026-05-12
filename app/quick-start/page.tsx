'use client'

import { useState } from 'react'
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestoreDb } from '@/lib/firebase'
import { setDoc, doc } from 'firebase/firestore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Hospital, CheckCircle2, AlertCircle } from 'lucide-react'

export default function QuickStartPage() {
  const [email, setEmail] = useState('admin@pronurse.com')
  const [password, setPassword] = useState('Admin@1234')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const createAdmin = async () => {
    try {
      setLoading(true)
      setMessage(null)

      if (!isFirebaseConfigured()) {
        setMessage({ type: 'error', text: 'Firebase غير مُعد بشكل صحيح' })
        return
      }

      const auth = getFirebaseAuth()
      const db = getFirestoreDb()

      // إنشاء حساب في Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid

      // إنشاء مستند Firestore
      await setDoc(doc(db, 'users', uid), {
        name: 'Ahmed Admin',
        nameAr: 'أحمد الإداري',
        email: email,
        employeeCode: 'ADM001',
        role: 'super_admin',
        roleId: 'super_admin',
        status: 'active',
        department: 'الإدارة',
        departmentId: 'admin',
        phone: '+966000000000',
        hireDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mustChangePassword: false,
      })

      setMessage({
        type: 'success',
        text: `تم إنشاء حساب بنجاح! البريد: ${email} | كلمة المرور: ${password}`,
      })

      // إعادة التوجيه بعد ثانيتين
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: `خطأ: ${error.message || 'فشل إنشاء الحساب'}`,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-600">
              <Hospital className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">PRO Nurse</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">إعداد النظام الأول</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {message && (
            <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <div className="flex gap-2">
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                  {message.text}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold mb-2 block">البريد الإلكتروني</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@pronurse.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">كلمة المرور</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin@1234"
                disabled={loading}
              />
            </div>
          </div>

          <Button
            onClick={createAdmin}
            disabled={loading || !email || !password}
            className="w-full h-11 font-semibold"
          >
            {loading ? 'جاري الإنشاء...' : 'إنشاء حساب Admin الأول'}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            هذه الصفحة ستنقلك تلقائياً إلى تسجيل الدخول بعد الانتهاء
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
