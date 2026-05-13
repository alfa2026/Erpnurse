'use client'

import * as React from 'react'
import {
  Shield, Check, X, Plus, Trash2, Save,
  Search, Users, ChevronRight, Palette
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useFirestoreCollection } from '@/hooks/use-firestore'
import { COLLECTIONS } from '@/types'

// مصفوفة الصلاحيات الكاملة لجميع أقسام المستشفى
const PERMISSION_MODULES = [
  {
    id: 'admin', labelAr: 'الإدارة العامة',
    permissions: [
      { id: 'users.manage', labelAr: 'إدارة الموظفين' },
      { id: 'roles.manage', labelAr: 'إدارة الصلاحيات' },
      { id: 'settings.manage', labelAr: 'إعدادات المستشفى' },
    ],
  },
  {
    id: 'nursing', labelAr: 'قسم التمريض والرعاية',
    permissions: [
      { id: 'patients.view', labelAr: 'عرض ملفات المرضى' },
      { id: 'vitals.manage', labelAr: 'تسجيل العلامات الحيوية' },
      { id: 'tasks.manage', labelAr: 'إدارة مهام التمريض' },
      { id: 'handover.manage', labelAr: 'تسليم وتسلم الشفتات' },
    ],
  },
  {
    id: 'pharmacy', labelAr: 'الصيدلية والمخازن',
    permissions: [
      { id: 'inventory.view', labelAr: 'عرض المخزون' },
      { id: 'inventory.manage', labelAr: 'إدارة الأدوية والمستلزمات' },
      { id: 'prescriptions.dispense', labelAr: 'صرف الوصفات الطبية' },
    ],
  },
  {
    id: 'finance', labelAr: 'الحسابات والمالية',
    permissions: [
      { id: 'billing.manage', labelAr: 'إدارة الفواتير والتحصيل' },
      { id: 'payroll.view', labelAr: 'عرض الرواتب' },
      { id: 'reports.financial', labelAr: 'التقارير المالية' },
    ],
  },
  {
    id: 'hr', labelAr: 'الموارد البشرية',
    permissions: [
      { id: 'attendance.view', labelAr: 'عرض الحضور والانصراف' },
      { id: 'leave.approve', labelAr: 'الموافقة على الإجازات' },
      { id: 'shifts.schedule', labelAr: 'جدولة الشفتات' },
    ],
  }
]

export default function RolesPage() {
  const { data: roles, loading, add, update, remove } = useFirestoreCollection(COLLECTIONS.ROLES)
  
  const [selectedRole, setSelectedRole] = React.useState<any>(null)
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [newRole, setNewRole] = React.useState({ 
    name: '', 
    nameAr: '', 
    description: '', 
    descriptionAr: '',
    color: '#4f46e5' 
  })

  const filteredRoles = roles.filter(r =>
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) || r.nameAr?.includes(searchQuery)
  )

  const togglePermission = async (roleId: string, permissionId: string) => {
    const role = roles.find(r => r.id === roleId)
    if (!role || role.isSystem) return

    const hasPermission = role.permissions?.includes(permissionId)
    const newPermissions = hasPermission 
      ? role.permissions.filter((p: string) => p !== permissionId)
      : [...(role.permissions || []), permissionId]

    try {
      await update(roleId, { permissions: newPermissions, updatedAt: new Date().toISOString() })
      toast.success('تم تحديث الصلاحية')
    } catch (err) {
      toast.error('فشل التحديث')
    }
  }

  const handleCreateRole = async () => {
    if (!newRole.name || !newRole.nameAr) {
      toast.error('يرجى إدخال اسم الدور باللغتين')
      return
    }
    
    try {
      await add({
        ...newRole,
        permissions: ['dashboard.view'],
        isActive: true,
        isSystem: false,
        userCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      setShowCreateDialog(false)
      setNewRole({ name: '', nameAr: '', description: '', descriptionAr: '', color: '#4f46e5' })
      toast.success('تم إنشاء الدور بنجاح')
    } catch (err) {
      toast.error('حدث خطأ أثناء الإنشاء')
    }
  }

  const handleDeleteRole = async (roleId: string, e: React.MouseEvent) => {
    e.stopPropagation() // منع اختيار الدور عند الحذف
    const role = roles.find(r => r.id === roleId)
    if (role?.isSystem) {
      toast.error('لا يمكن حذف دور نظامي')
      return
    }
    if (confirm('هل أنت متأكد من حذف هذا الدور؟')) {
      await remove(roleId)
      if (selectedRole?.id === roleId) setSelectedRole(null)
      toast.info('تم الحذف')
    }
  }

  if (loading) return <div className="p-10 text-center font-bold">جاري تحميل نظام الصلاحيات...</div>

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8 text-indigo-600" /> إدارة الصلاحيات والأدوار
          </h1>
          <p className="text-muted-foreground mt-1">تحكم في وصول الموظفين لموديلات الـ ERP</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-5 w-5" /> إنشاء دور جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Right Side: Roles List */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="بحث عن دور (مثلاً: ممرض)..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              className="pr-10" 
            />
          </div>

          <div className="space-y-3">
            {filteredRoles.map(role => (
              <Card 
                key={role.id} 
                className={`cursor-pointer border-2 transition-all hover:border-indigo-300 ${selectedRole?.id === role.id ? 'border-indigo-600 shadow-md bg-indigo-50/30' : 'border-transparent'}`}
                onClick={() => setSelectedRole(role)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-10 rounded-full" style={{ backgroundColor: role.color }} />
                      <div>
                        <p className="font-bold text-lg">{role.nameAr}</p>
                        <p className="text-xs text-muted-foreground">{role.name}</p>
                      </div>
                    </div>
                    {!role.isSystem && (
                      <Button variant="ghost" size="icon" onClick={(e) => handleDeleteRole(role.id, e)} className="text-red-500 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Left Side: Permissions Matrix */}
        <div className="lg:col-span-8">
          {selectedRole ? (
            <Card className="border-t-4" style={{ borderTopColor: selectedRole.color }}>
              <CardHeader className="bg-slate-50/50">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{selectedRole.nameAr}</CardTitle>
                    <CardDescription className="mt-2">{selectedRole.descriptionAr || 'لا يوجد وصف'}</CardDescription>
                  </div>
                  <Badge variant={selectedRole.isSystem ? "secondary" : "outline"} className="text-sm">
                    {selectedRole.isSystem ? 'دور نظامي (محمي)' : 'دور مخصص'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {PERMISSION_MODULES.map(module => (
                  <div key={module.id} className="space-y-3">
                    <h3 className="font-bold text-indigo-900 flex items-center gap-2 border-b pb-2">
                      <ChevronRight className="h-4 w-4 rotate-180" /> {module.labelAr}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {module.permissions.map(perm => (
                        <div key={perm.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50 transition-colors">
                          <Label htmlFor={perm.id} className="flex-1 cursor-pointer">{perm.labelAr}</Label>
                          <Switch 
                            id={perm.id}
                            disabled={selectedRole.isSystem}
                            checked={selectedRole.permissions?.includes(perm.id)}
                            onCheckedChange={() => togglePermission(selectedRole.id, perm.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-3xl text-muted-foreground">
              <Shield className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-xl">اختر مسمى وظيفي من القائمة لعرض صلاحياته</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">إضافة دور وظيفي جديد</DialogTitle>
            <DialogDescription>سيظهر هذا المسمى عند تفعيل حسابات الموظفين الجدد</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 text-right">
                <Label>المسمى (عربي)</Label>
                <Input placeholder="مثلاً: ممرض مسؤول" value={newRole.nameAr} onChange={(e) => setNewRole({...newRole, nameAr: e.target.value})} />
              </div>
              <div className="space-y-2 text-right">
                <Label>Name (English)</Label>
                <Input placeholder="e.g. Head Nurse" value={newRole.name} onChange={(e) => setNewRole({...newRole, name: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2 text-right">
              <Label>وصف الدور</Label>
              <Textarea placeholder="شرح مختصر لصلاحيات هذا الدور" value={newRole.descriptionAr} onChange={(e) => setNewRole({...newRole, descriptionAr: e.target.value})} />
            </div>
            <div className="space-y-2 text-right">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" /> لون التميز (Badge Color)
              </Label>
              <div className="flex gap-4 items-center">
                <Input 
                  type="color" 
                  className="w-16 h-10 p-1 cursor-pointer" 
                  value={newRole.color} 
                  onChange={(e) => setNewRole({...newRole, color: e.target.value})} 
                />
                <code className="bg-slate-100 px-3 py-2 rounded text-sm">{newRole.color}</code>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>إلغاء</Button>
            <Button onClick={handleCreateRole} className="bg-indigo-600 hover:bg-indigo-700">إنشاء الدور وحفظه</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
