'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { Mail, CheckCircle2 } from 'lucide-react'

interface ForgotPasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isAr: boolean
}

export function ForgotPasswordDialog({
  open,
  onOpenChange,
  isAr,
}: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error(isAr ? 'أدخل بريدك الإلكتروني' : 'Please enter your email')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) throw new Error('Failed to send reset email')

      setSent(true)
      toast.success(
        isAr
          ? 'تم إرسال رابط إعادة تعيين كلمة المرور'
          : 'Password reset link sent to your email'
      )
    } catch (error: any) {
      toast.error(error.message || (isAr ? 'فشل الإرسال' : 'Failed to send'))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail('')
    setSent(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isAr ? 'استعادة كلمة المرور' : 'Reset Password'}
          </DialogTitle>
          <DialogDescription>
            {isAr
              ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين'
              : 'Enter your email and we will send you a reset link'}
          </DialogDescription>
        </DialogHeader>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">
                {isAr ? 'البريد الإلكتروني' : 'Email Address'}
              </Label>
              <Input
                id="reset-email"
                type="email"
                placeholder={isAr ? 'admin@pronurse.com' : 'your@email.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <Mail className="h-4 w-4" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                {isAr
                  ? 'ستتلقى رسالة بريد إلكترونية تحتوي على رابط آمن'
                  : 'You will receive an email with a secure reset link'}
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="flex-1"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (isAr ? 'جاري الإرسال...' : 'Sending...') : (isAr ? 'إرسال' : 'Send')}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 py-6 text-center">
            <div className="flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="font-semibold">
                {isAr ? 'تم الإرسال!' : 'Email Sent!'}
              </p>
              <p className="text-sm text-muted-foreground">
                {isAr
                  ? `تم إرسال رابط إعادة تعيين إلى ${email}`
                  : `We sent a reset link to ${email}`}
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              {isAr ? 'حسناً' : 'Done'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
