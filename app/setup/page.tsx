'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Hospital, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function SetupPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [adminData, setAdminData] = useState<any>(null)

  const createAdmin = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@pronurse.com',
          password: 'Admin@1234',
          name: 'Ahmed Admin',
          nameAr: 'أحمد الإداري',
          employeeCode: 'ADM001',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'فشل إنشاء الحساب')
        return
      }

      setSuccess(true)
      setAdminData(data)
      toast.success('تم إنشاء حساب Admin بنجاح!')
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-600 shadow-lg">
              <Hospital className="h-9 w-9 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-teal-700">PRO Nurse</h1>
          <p className="text-sm text-muted-foreground">إعداد النظام - Setup System</p>
        </div>

        {/* Setup Card */}
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-4">
            <CardTitle>إنشاء حساب المسؤول الأول</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Create First Admin Account</p>
          </CardHeader>

          <CardContent className="space-y-6">
            {!success ? (
              <>
                {/* Info Box */}
                <Alert className="border-teal-200 bg-teal-50">
                  <AlertCircle className="h-4 w-4 text-teal-600" />
                  <AlertDescription className="text-teal-700 text-sm">
                    سيتم إنشاء حساب مسؤول بالبيانات التالية:
                    <br />
                    <strong>البريد:</strong> admin@pronurse.com
                    <br />
                    <strong>كلمة المرور:</strong> Admin@1234
                    <br />
                    <strong>الدور:</strong> super_admin
                  </AlertDescription>
                </Alert>

                {/* Create Button */}
                <Button
                  onClick={createAdmin}
                  disabled={loading}
                  className="w-full h-12 text-base font-semibold"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      جاري الإنشاء...
                    </>
                  ) : (
                    'إنشاء حساب Admin'
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Create Admin Account
                </p>
              </>
            ) : (
              <>
                {/* Success */}
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-green-700">تم بنجاح!</h2>

                  {/* Admin Credentials */}
                  <div className="bg-slate-100 rounded-lg p-4 space-y-2 text-left">
                    <p className="text-sm">
                      <strong>البريد الإلكتروني:</strong>
                      <br />
                      admin@pronurse.com
                    </p>
                    <p className="text-sm">
                      <strong>كلمة المرور:</strong>
                      <br />
                      Admin@1234
                    </p>
                    <p className="text-sm">
                      <strong>الدور:</strong>
                      <br />
                      super_admin
                    </p>
                  </div>

                  {/* Next Steps */}
                  <Alert className="border-blue-200 bg-blue-50">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700 text-sm">
                      اذهب الآن إلى صفحة تسجيل الدخول وجرب البيانات أعلاه
                    </AlertDescription>
                  </Alert>

                  {/* Next Button */}
                  <Button
                    onClick={() => (window.location.href = '/login')}
                    className="w-full"
                  >
                    انتقل إلى صفحة الدخول
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground">
          PRO Nurse Hospital Management System © 2024
        </p>
      </div>
    </div>
  )
}
