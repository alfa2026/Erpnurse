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

export default function WhatsAppSend({ open, onOpenChange }: Props) {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  const handleSend = () => {
    if (!phone || !message) {
      toast.error(isAr ? "اكمل البيانات" : "Complete data")
      return
    }
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isAr ? "إرسال واتساب" : "Send WhatsApp"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Input 
            placeholder={isAr ? "رقم الهاتف (بمفتاح الدولة)" : "Phone number"} 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)} 
          />
          <Input 
            placeholder={isAr ? "الرسالة" : "Message"} 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
          />
          <Button className="w-full" onClick={handleSend}>
            {isAr ? "إرسال" : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
