'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useLang } from '@/contexts/lang-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// التصدير هنا Default Export
export default function WhatsAppSend({ open, onOpenChange }: Props) {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (!phone || !message) {
      toast.error(isAr ? "يرجى إكمال البيانات" : "Please complete data")
      return
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isAr ? "إرسال رسالة واتساب" : "Send WhatsApp Message"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input 
              placeholder={isAr ? "رقم الهاتف (مثال: 201234567890)" : "Phone number"} 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Input 
              placeholder={isAr ? "اكتب رسالتك هنا..." : "Type message..."} 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
            />
          </div>
          <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleSend}>
            {isAr ? "فتح واتساب" : "Open WhatsApp"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
