'use client'

import * as React from 'react'
import {
  Shield, Plus, Trash2, ChevronRight, Search, Palette
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useFirestoreCollection } from '@/hooks/use-firestore'
import { COLLECTIONS } from '@/types'

// --- هنا إضافة التغليف والحماية ---
import { PermissionGuard } from '@/components/auth/permission-guard'

const PERMISSION_MODULES = [
  {
    id: 'admin', labelAr: 'الإدارة العامة',
    permissions: [
      { id: 'users.manage', labelAr: 'إدارة الموظفين' },
      { id: 'roles.manage', labelAr: 'إدارة الصلاحيات' },
    ],
  },
  {
    id: 'nursing', labelAr: 'قسم التمريض',
    permissions: [
      { id: 'patients.view', labelAr: 'عرض المرضى' },
      { id: 'vitals.manage', labelAr: 'العلامات الحيوية' },
    ],
  },
  {
    id: 'pharmacy', labelAr: 'الصيدلية',
    permissions: [
      { id: 'inventory.manage', labelAr: 'إدارة المخزون' },
    ],
  }
]

// الوظيفة الرئيسية التي تصدر الصفحة مع الحماية
export default function RolesPage() {
  return (
    <PermissionGuard permission="roles.manage">
      <RolesContent />
    </PermissionGuard>
  )
}

// محتوى الصفحة الفعلي
function RolesContent() {
  const { data: roles, loading, add, update, remove } = useFirestoreCollection(COLLECTIONS.ROLES)
  const [selectedRole, setSelectedRole] = React.useState<any>(null)
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [newRole, setNewRole] = React.useState({ name: '', nameAr: '', description: '', descriptionAr: '', color: '#4f46e5' })

  const filteredRoles = roles.filter(r => r.nameAr?.includes(searchQuery))

  const togglePermission = async (roleId: string, permissionId: string) => {
    const role = roles.find(r => r.id === roleId)
    if (!role || role.isSystem) return
    const newPermissions = role.permissions?.includes(permissionId)
      ? role.permissions.filter((p: string) => p !== permissionId)
      : [...(role.permissions || []), permissionId]
    await update(roleId, { permissions: newPermissions })
    toast.success('تم تحديث الصلاحية')
  }

  const handleCreateRole = async () => {
    if(!newRole.nameAr) return toast.error("أدخل اسم الدور")
    await add({ ...newRole, permissions: ['dashboard.view'], isActive: true, isSystem: false, createdAt: new Date().toISOString() })
    setShowCreateDialog(false)
    setNewRole({ name: '', nameAr: '', description: '', descriptionAr: '', color: '#4f46e5' })
    toast.success('تم إنشاء الدور بنجاح')
  }

  if (loading) return <div className="p-10 text-center font-bold">جاري تحميل الصلاحيات...</div>

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* الهيدر */}
      <div className="flex justify-between items-center text-right">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
             إدارة الصلاحيات <Shield className="h-8 w-8 text-indigo-600" />
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">حدد من يمكنه الوصول لأقسام نظام الـ ERP</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 ml-2" /> إضافة دور جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* قائمة الأدوار */}
        <div className="lg:col-span-4 space-y-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="بحث عن مسمى وظيفي..." className="pr-10 text-right" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          
          <div className="space-y-2">
            {filteredRoles.map(role => (
              <Card key={role.id} className={`cursor-pointer transition-all ${selectedRole?.id === role.id ? 'ring-2 ring-indigo-600 bg-indigo-50/50' : ''}`} onClick={() => setSelectedRole(role)}>
                <CardContent className="p-4 flex items-center justify-between">
                  {!role.isSystem && (
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); remove(role.id) }} className="text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="flex items-center gap-3 text-right flex-1 justify-end">
                    <div>
                      <p className="font-bold">{role.nameAr}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">{role.name}</p>
                    </div>
                    <div className="w-2 h-10 rounded-full" style={{ backgroundColor: role.color }} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* مصفوفة الصلاحيات */}
        <div className="lg:col-span-8">
          {selectedRole ? (
            <Card className="text-right border-t-4 shadow-sm" style={{ borderTopColor: selectedRole.color }}>
              <CardHeader className="bg-slate-50/50 border-b">
                <CardTitle className="text-xl">{selectedRole.nameAr}</CardTitle>
                <CardDescription>تعديل صلاحيات الوصول لهذا المسمى الوظيفي</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {PERMISSION_MODULES.map(module => (
                  <div key={module.id} className="space-y-4 text-right">
                    <h3 className="font-bold text-indigo-900 border-b pb-2 flex items-center justify-end gap-2">
                       {module.labelAr} <ChevronRight className="h-4 w-4 rotate-180" />
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {module.permissions.map(perm => (
                        <div key={perm.id} className="flex items-center justify-between p-4 border rounded-xl bg-slate-50 hover:bg-white transition-all">
                          <Switch 
                            disabled={selectedRole.isSystem} 
                            checked={selectedRole.permissions?.includes(perm.id)} 
                            onCheckedChange={() => togglePermission(selectedRole.id, perm.id)} 
                          />
                          <Label className="text-sm font-medium cursor-pointer">{perm.labelAr}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-3xl text-muted-foreground bg-slate-50/50">
              <Shield className="h-16 w-16 mb-4 opacity-10" />
              <p className="text-lg">اختر مسمى وظيفي من القائمة لعرض وإدارة صلاحياته</p>
            </div>
          )}
        </div>
      </div>

      {/* نافذة الإنشاء */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent dir="rtl" className="text-right sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">إضافة مسمى وظيفي جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-2">
              <Label>اسم الدور (بالعربي)</Label>
              <Input placeholder="مثال: ممرض عمليات" value={newRole.nameAr} onChange={(e) => setNewRole({...newRole, nameAr: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Role Name (English)</Label>
              <Input placeholder="e.g. OR Nurse" value={newRole.name} onChange={(e) => setNewRole({...newRole, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 justify-end">
                لون التميز <Palette className="h-4 w-4" />
              </Label>
              <div className="flex gap-4 items-center flex-row-reverse">
                <Input type="color" className="h-10 w-20 p-1 cursor-pointer" value={newRole.color} onChange={(e) => setNewRole({...newRole, color: e.target.value})} />
                <code className="bg-slate-100 px-2 py-1 rounded text-xs">{newRole.color}</code>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateRole} className="w-full bg-indigo-600 hover:bg-indigo-700">حفظ المسمى الوظيفي</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
