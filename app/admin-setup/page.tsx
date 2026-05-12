'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { useLang } from '@/contexts/lang-context'

export default function SetupAdminPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleCreateAdmin = async () => {
    setStatus('loading')
    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await response.json()

      if (!response.ok) {
        setStatus('error')
        setMessage(data.error || (isAr ? 'فشل إنشاء حساب Admin' : 'Failed to create admin'))
        return
      }

      setStatus('success')
      setMessage(isAr 
        ? 'تم إنشاء حساب Admin بنجاح!\n\nالبريد الإلكتروني: admin@pronurse.com\nكلمة المرور: Admin@1234\n\nيمكنك الآن تسجيل الدخول'
        : 'Admin account created successfully!\n\nEmail: admin@pronurse.com\nPassword: Admin@1234\n\nYou can now login'
      )
    } catch (err: any) {
      setStatus('error')
      setMessage(err.message || (isAr ? 'حدث خطأ' : 'An error occurred'))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-primary/10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className={isAr ? 'text-right' : ''}>
            {isAr ? 'إعداد حساب المسؤول' : 'Admin Setup'}
          </CardTitle>
          <CardDescription className={isAr ? 'text-right' : ''}>
            {isAr 
              ? 'إنشاء حساب المسؤول الأول للنظام'
              : 'Create the first admin account for the system'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200 whitespace-pre-wrap">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && (
            <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800 dark:text-red-200">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {status === 'idle' && (
            <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800 text-sm">
                <p className={isAr ? 'text-right' : ''}>
                  {isAr ? (
                    <>
                      <strong>سيتم إنشاء:</strong>
                      <br />• البريد: admin@pronurse.com
                      <br />• كلمة المرور: Admin@1234
                      <br />• الدور: مسؤول عام
                      <br />• الحالة: نشط
                    </>
                  ) : (
                    <>
                      <strong>Will create:</strong>
                      <br />• Email: admin@pronurse.com
                      <br />• Password: Admin@1234
                      <br />• Role: Super Admin
                      <br />• Status: Active
                    </>
                  )}
                </p>
              </div>

              <Button
                onClick={handleCreateAdmin}
                disabled={status === 'loading'}
                className="w-full"
                size="lg"
              >
                {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {isAr ? 'إنشاء حساب Admin' : 'Create Admin Account'}
              </Button>
            </div>
          )}

          {status === 'success' && (
            <Button
              onClick={() => window.location.href = '/login'}
              className="w-full"
              size="lg"
            >
              {isAr ? 'انتقل إلى صفحة تسجيل الدخول' : 'Go to Login'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
