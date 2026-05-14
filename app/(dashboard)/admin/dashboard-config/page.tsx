'use client'

import * as React from 'react'
import { useState } from 'react'
import {
  LayoutDashboard, Plus, Edit, Trash2, BarChart3, PieChart, Activity, 
  Users, Calendar, Clock, Bell, TrendingUp, Save, RotateCcw, Bed, Building2
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

// ─── Inline Switch Component (Turbopack-safe) ──────────
function InlineSwitch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: () => void }) {
  return (
    <button 
      type="button" 
      onClick={onCheckedChange}
      className={cn(
        'inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-teal-600' : 'bg-slate-300'
      )}
    >
      <span
        className={cn(
          'pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform',
          checked ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  )
}

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

// ─── البيانات الأصلية كاملة ──────────────────────────────────────
const INITIAL_WIDGETS: DashboardWidget[] = [
  { id: 'w1', name: 'Total Staff', nameAr: 'إجمالي الموظفين', type: 'stat_card', size: 'small', icon: 'users', isVisible: true, order: 1, visibleToRoles: ['super_admin', 'hospital_admin', 'hr_manager'], visibleToDepartments: ['all'], refreshInterval: 60 },
  { id: 'w2', name: 'Active Shifts', nameAr: 'المناوبات النشطة', type: 'stat_card', size: 'small', icon: 'clock', isVisible: true, order: 2, visibleToRoles: ['super_admin', 'hospital_admin', 'dept_manager', 'head_nurse'], visibleToDepartments: ['all'], refreshInterval: 30 },
  { id: 'w3', name: 'Bed Occupancy', nameAr: 'إشغال الأسرة', type: 'stat_card', size: 'small', icon: 'bed', isVisible: true, order: 3, visibleToRoles: ['super_admin', 'hospital_admin', 'dept_manager'], visibleToDepartments: ['medical'], refreshInterval: 30 },
  { id: 'w4', name: 'Pending Approvals', nameAr: 'الطلبات المعلقة', type: 'stat_card', size: 'small', icon: 'bell', isVisible: true, order: 4, visibleToRoles: ['super_admin', 'hospital_admin', 'hr_manager', 'dept_manager'], visibleToDepartments: ['all'], refreshInterval: 15 },
  { id: 'w5', name: 'Weekly Shift Chart', nameAr: 'مخطط المناوبات الأسبوعي', type: 'chart', size: 'large', icon: 'bar_chart', isVisible: true, order: 5, visibleToRoles: ['super_admin', 'hospital_admin', 'dept_manager', 'head_nurse'], visibleToDepartments: ['all'], refreshInterval: 300 },
  { id: 'w6', name: 'Department Analytics', nameAr: 'تحليلات الأقسام', type: 'chart', size: 'medium', icon: 'pie_chart', isVisible: true, order: 6, visibleToRoles: ['super_admin', 'hospital_admin'], visibleToDepartments: ['all'], refreshInterval: 300 },
  { id: 'w7', name: 'Attendance Summary', nameAr: 'ملخص الحضور', type: 'chart', size: 'medium', icon: 'trending', isVisible: true, order: 7, visibleToRoles: ['super_admin', 'hospital_admin', 'hr_manager', 'dept_manager'], visibleToDepartments: ['all'], refreshInterval: 120 },
  { id: 'w8', name: 'Recent Activity', nameAr: 'آخر النشاطات', type: 'activity_feed', size: 'medium', icon: 'activity', isVisible: true, order: 8, visibleToRoles: ['super_admin', 'hospital_admin'], visibleToDepartments: ['all'], refreshInterval: 30 },
  { id: 'w9', name: 'Upcoming Shifts', nameAr: 'المناوبات القادمة', type: 'calendar', size: 'medium', icon: 'calendar', isVisible: true, order: 9, visibleToRoles: ['super_admin', 'hospital_admin', 'dept_manager', 'head_nurse', 'nurse'], visibleToDepartments: ['all'], refreshInterval: 60 },
  { id: 'w10', name: 'Critical Alerts', nameAr: 'التنبيهات الحرجة', type: 'alert', size: 'full', icon: 'bell', isVisible: true, order: 10, visibleToRoles: ['super_admin', 'hospital_admin'], visibleToDepartments: ['all'], refreshInterval: 10 },
]

const ROLES_LIST = [
  { id: 'super_admin', label: 'مدير النظام' },
  { id: 'hospital_admin', label: 'مدير المستشفى' },
  { id: 'hr_manager', label: 'مدير الموارد البشرية' },
  { id: 'dept_manager', label: 'مدير قسم' },
  { id: 'head_nurse', label: 'رئيسة التمريض' },
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
    toast.success('تم التحديث')
  }

  return (
    <div className="space-y-6 p-4" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-800">
            <LayoutDashboard className="h-7 w-7 text-teal-600" />
            إعدادات لوحة التحكم
          </h1>
          <p className="text-muted-foreground text-sm">تخصيص عناصر لوحة التحكم حسب الأدوار</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => {setWidgets(INITIAL_WIDGETS); setHasChanges(false)}}>
            <RotateCcw className="h-4 w-4 ml-1" /> تراجع
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-md" size="sm" onClick={() => {toast.success('تم حفظ الإعدادات'); setHasChanges(false)}} disabled={!hasChanges}>
            <Save className="h-4 w-4 ml-1" /> حفظ التغييرات
          </Button>
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets.map((widget) => (
          <Card key={widget.id} className={cn('transition-all border-none shadow-sm', !widget.isVisible && 'opacity-50 grayscale')}>
            <CardContent className="pt-5 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center border border-teal-100">
                    <BarChart3 className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{widget.nameAr}</h3>
                    <p className="text-[10px] text-slate-400">{WIDGET_TYPE_LABELS[widget.type]} • {SIZE_LABELS[widget.size]}</p>
                  </div>
                </div>
                {/* Custom Inline Switch */}
                <InlineSwitch 
                  checked={widget.isVisible} 
                  onCheckedChange={() => toggleVisibility(widget.id)} 
                />
              </div>
              
              <div className="flex flex-wrap gap-1 mb-4 h-12 overflow-hidden items-start">
                {widget.visibleToRoles.map((r) => (
                  <Badge key={r} variant="outline" className="text-[9px] bg-slate-50">{r}</Badge>
                ))}
              </div>

              <div className="flex items-center gap-2 border-t pt-4">
                <Button variant="ghost" size="sm" className="h-8 text-xs flex-1 hover:bg-teal-50 hover:text-teal-600" onClick={() => openEdit(widget)}>
                  <Edit className="h-3 w-3 ml-1" /> تعديل
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive flex-1 hover:bg-red-50">
                  <Trash2 className="h-3 w-3 ml-1" /> حذف
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-right font-bold text-slate-800">تعديل العنصر</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4" dir="rtl">
            <div className="space-y-2 text-right">
              <Label className="text-slate-600">الاسم بالعربي</Label>
              <Input className="rounded-lg" value={form.nameAr} onChange={(e) => setForm({ ...form, nameAr: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-right">
              <div className="space-y-2">
                <Label className="text-slate-600">النوع</Label>
                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(WIDGET_TYPE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-600">الحجم</Label>
                <Select value={form.size} onValueChange={(v: any) => setForm({ ...form, size: v })}>
                  <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(SIZE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Label className="text-slate-600">تحديث كل (ثانية)</Label>
              <Input type="number" className="rounded-lg" value={form.refreshInterval} onChange={(e) => setForm({ ...form, refreshInterval: +e.target.value })} />
            </div>
          </div>
          <DialogFooter className="flex gap-2 justify-start mt-4">
            <Button className="bg-teal-600 hover:bg-teal-700 text-white px-8 rounded-lg" onClick={handleSave}>حفظ</Button>
            <Button variant="outline" className="rounded-lg" onClick={() => setDialogOpen(false)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
