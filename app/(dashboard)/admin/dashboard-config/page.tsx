'use client'

import * as React from 'react'
import { useState } from 'react'
import {
  LayoutDashboard, Plus, Edit, Trash2, BarChart3, PieChart, Activity, 
  Users, Calendar, Clock, Bell, TrendingUp, Save, RotateCcw,
} from 'lucide-react'

// استيراد المكونات مع التأكد من وجودها
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// المكونات اللي كانت بتعمل مشاكل تم استيرادها بحذر
import * as SelectPrimitive from "@radix-ui/react-select"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

// ─── Types ─────────────────────────────────────────────
interface DashboardWidget {
  id: string
  name: string
  nameAr: string
  type: 'stat_card' | 'chart' | 'table' | 'activity_feed' | 'calendar' | 'alert'
  size: 'small' | 'medium' | 'large' | 'full'
  icon: string
  isVisible: boolean
  order: number
  visibleToRoles: string[]
  visibleToDepartments: string[]
  refreshInterval: number
}

// ─── INITIAL DATA ──────────────────────────────────────
const INITIAL_WIDGETS: DashboardWidget[] = [
  { id: 'w1', name: 'Total Staff', nameAr: 'إجمالي الموظفين', type: 'stat_card', size: 'small', icon: 'users', isVisible: true, order: 1, visibleToRoles: ['super_admin'], visibleToDepartments: ['all'], refreshInterval: 60 },
  { id: 'w2', name: 'Active Shifts', nameAr: 'المناوبات النشطة', type: 'stat_card', size: 'small', icon: 'clock', isVisible: true, order: 2, visibleToRoles: ['super_admin'], visibleToDepartments: ['all'], refreshInterval: 30 },
  { id: 'w5', name: 'Weekly Shift Chart', nameAr: 'مخطط المناوبات الأسبوعي', type: 'chart', size: 'large', icon: 'bar_chart', isVisible: true, order: 5, visibleToRoles: ['super_admin'], visibleToDepartments: ['all'], refreshInterval: 300 },
]

const ROLES_LIST = [
  { id: 'super_admin', label: 'مدير النظام' },
  { id: 'hospital_admin', label: 'مدير المستشفى' },
  { id: 'nurse', label: 'ممرض/ة' },
]

const WIDGET_TYPE_LABELS: Record<string, string> = {
  stat_card: 'بطاقة إحصائية', chart: 'مخطط بياني',
  table: 'جدول', activity_feed: 'تغذية نشاطات',
  calendar: 'تقويم', alert: 'تنبيهات',
}

const SIZE_LABELS: Record<string, string> = { small: 'صغير', medium: 'متوسط', large: 'كبير', full: 'كامل العرض' }

export default function DashboardConfigPage() {
  const [widgets, setWidgets] = useState(INITIAL_WIDGETS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editWidget, setEditWidget] = useState<DashboardWidget | null>(null)
  const [hasChanges, setHasChanges] = useState(false)
  
  const [form, setForm] = useState({
    nameAr: '', type: 'stat_card' as DashboardWidget['type'],
    size: 'small' as DashboardWidget['size'],
    refreshInterval: 60, visibleToRoles: [] as string[],
  })

  const toggleVisibility = (id: string) => {
    setWidgets((prev) => prev.map((w) => w.id === id ? { ...w, isVisible: !w.isVisible } : w))
    setHasChanges(true)
  }

  const openEdit = (widget: DashboardWidget) => {
    setEditWidget(widget)
    setForm({
      nameAr: widget.nameAr, type: widget.type, size: widget.size,
      refreshInterval: widget.refreshInterval, visibleToRoles: [...widget.visibleToRoles],
    })
    setDialogOpen(true)
  }

  const handleSave = () => {
    if (!form.nameAr) { toast.error('اسم العنصر مطلوب'); return }
    if (editWidget) {
      setWidgets((prev) => prev.map((w) => w.id === editWidget.id ? { ...w, ...form } : w))
    }
    setDialogOpen(false)
    setHasChanges(true)
    toast.success('تم التحديث مؤقتاً')
  }

  return (
    <div className="space-y-6 p-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-teal-600" />
            إعدادات لوحة التحكم
          </h1>
          <p className="text-muted-foreground text-sm">تخصيص عناصر لوحة التحكم حسب الأدوار</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setHasChanges(false)}>
            <RotateCcw className="h-4 w-4 ml-1" /> تراجع
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white" size="sm" onClick={() => toast.success('تم الحفظ')}>
            <Save className="h-4 w-4 ml-1" /> حفظ النهائي
          </Button>
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map((widget) => (
          <Card key={widget.id} className={cn('transition-all', !widget.isVisible && 'opacity-50 border-dashed')}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{widget.nameAr}</h3>
                    <p className="text-[10px] text-muted-foreground">{WIDGET_TYPE_LABELS[widget.type]}</p>
                  </div>
                </div>
                {/* Switch البديل لتجنب أخطاء الاستيراد */}
                <button 
                  onClick={() => toggleVisibility(widget.id)}
                  className={cn("w-10 h-5 rounded-full relative transition-colors", widget.isVisible ? "bg-teal-600" : "bg-slate-300")}
                >
                  <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", widget.isVisible ? "right-6" : "right-1")} />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {widget.visibleToRoles.map((r) => (
                  <Badge key={r} variant="secondary" className="text-[9px]">{r}</Badge>
                ))}
              </div>

              <div className="flex items-center gap-2 border-t pt-3">
                <Button variant="ghost" size="sm" className="h-8 text-xs flex-1" onClick={() => openEdit(widget)}>
                  <Edit className="h-3 w-3 ml-1" /> تعديل
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive flex-1">
                  <Trash2 className="h-3 w-3 ml-1" /> حذف
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-right">تعديل العنصر</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4" dir="rtl">
            <div className="space-y-2 text-right">
              <Label>الاسم بالعربي</Label>
              <Input value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-right">
              <div className="space-y-2">
                <Label>النوع</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(WIDGET_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الحجم</Label>
                <Select value={form.size} onValueChange={(v: any) => setForm({ ...form, size: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SIZE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 justify-start">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSave}>حفظ التغييرات</Button>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
