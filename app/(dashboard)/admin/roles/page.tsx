'use client'

import * as React from 'react'
import {
  Shield, Check, X, Plus, Copy, Trash2, Save,
  ToggleLeft, Search, Users, ChevronDown, ChevronRight,
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
} from '@/dropdown-menu' // تأكد من المسار الصحيح في مشروعك
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { useFirestoreCollection } from '@/hooks/use-firestore'
import { COLLECTIONS } from '@/types'

// تحسين: تعريف الوحدات بنصوص عربية واضحة بدلاً من الـ Unicode
const PERMISSION_MODULES = [
  {
    id: 'dashboard', labelAr: 'لوحة التحكم',
    permissions: [
      { id: 'dashboard.view', labelAr: 'عرض' },
      { id: 'dashboard.analytics', labelAr: 'التحليلات' },
    ],
  },
  {
    id: 'users', labelAr: 'الموظفون',
    permissions: [
      { id: 'users.view', labelAr: 'عرض' },
      { id: 'users.create', labelAr: 'إنشاء' },
      { id: 'users.edit', labelAr: 'تعديل' },
      { id: 'users.delete', labelAr: 'حذف' },
      { id: 'users.approve', labelAr: 'موافقة' },
    ],
  },
  {
    id: 'roles', labelAr: 'الأدوار والصلاحيات',
    permissions: [
      { id: 'roles.manage', labelAr: 'تحكم كامل' },
    ],
  },
  // يمكنك إضافة باقي الوحدات هنا بنفس النمط
]

export default function RolesPage() {
  const { data: roles, loading, add, update, remove } = useFirestoreCollection(COLLECTIONS.ROLES)
  
  const [selectedRole, setSelectedRole] = React.useState<any>(null)
  const [showCreateDialog, setShowCreateDialog] = React.useState(false)
  const [showMatrixView, setShowMatrixView] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')
  const [expandedModules, setExpandedModules] = React.useState<string[]>([])
  const [newRole, setNewRole] = React.useState({ name: '', nameAr: '', description: '', descriptionAr: '' })

  const filteredRoles = roles.filter(r =>
    r.name?.toLowerCase().includes(searchQuery.toLowerCase()) || r.nameAr?.includes(searchQuery)
  )

  // دالة حفظ الصلاحيات في Firestore
  const togglePermission = async (roleId: string, permissionId: string) => {
    const role = roles.find(r => r.id === roleId)
    if (!role || role.isSystem) return

    const hasPermission = role.permissions?.includes(permissionId)
    const newPermissions = hasPermission 
      ? role.permissions.filter((p: string) => p !== permissionId)
      : [...(role.permissions || []), permissionId]

    try {
      await update(roleId, { permissions: newPermissions })
      toast.success('تم تحديث الصلاحية')
    } catch (err) {
      toast.error('فشل التحديث')
    }
  }

  // دالة إنشاء دور جديد في Firestore
  const handleCreateRole = async () => {
    if (!newRole.name || !newRole.nameAr) {
      toast.error('يرجى إدخال اسم الدور')
      return
    }
    
    try {
      await add({
        ...newRole,
        permissions: ['dashboard.view'],
        isActive: true,
        isSystem: false,
        userCount: 0,
        createdAt: new Date().toISOString()
      })
      setShowCreateDialog(false)
      setNewRole({ name: '', nameAr: '', description: '', descriptionAr: '' })
      toast.success('تم إنشاء الدور بنجاح')
    } catch (err) {
      toast.error('حدث خطأ أثناء الإنشاء')
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    if (role?.isSystem) {
      toast.error('لا يمكن حذف دور نظامي')
      return
    }
    if (confirm('هل أنت متأكد من حذف هذا الدور؟')) {
      await remove(roleId)
      toast.info('تم الحذف')
    }
  }

  if (loading) return <div className="p-10 text-center">جاري تحميل الصلاحيات...</div>

  return (
    <div className="space-y-6 p-4">
      {/* الهيدر وزر الإضافة */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" /> إدارة الأدوار والصلاحيات
          </h1>
          <p className="text-muted-foreground text-sm">حدد من يمكنه رؤية ماذا في النظام</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowMatrixView(!showMatrixView)}>
            {showMatrixView ? 'عرض البطاقات' : 'عرض المصفوفة'}
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 ml-2" /> دور جديد
          </Button>
        </div>
      </div>

      {/* البحث */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="بحث عن دور..." 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="pr-10" 
        />
      </div>

      {/* عرض الأدوار (Cards or Matrix) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* قائمة الأدوار */}
        <div className="space-y-4">
          {filteredRoles.map(role => (
            <Card 
              key={role.id} 
              className={`cursor-pointer transition-all ${selectedRole?.id === role.id ? 'ring-2 ring-blue-500 shadow-md' : ''}`}
              onClick={() => setSelectedRole(role)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className={`h-5 w-5 ${role.isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div>
                      <p className="font-bold">{role.nameAr}</p>
                      <p className="text-xs text-muted-foreground">{role.descriptionAr}</p>
                    </div>
                  </div>
                  {!role.isSystem && (
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteRole(role.id)} className="text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <Badge variant="outline">{role.permissions?.length || 0} صلاحية</Badge>
                  {role.isSystem && <Badge className="bg-gray-100 text-gray-600">نظامي</Badge>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* تفاصيل الصلاحيات (الجانب الأيسر) */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedRole.nameAr}</CardTitle>
                <CardDescription>تحكم في صلاحيات هذا الدور بدقة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {PERMISSION_MODULES.map(module => (
                  <div key={module.id} className="border rounded-lg p-4">
                    <h3 className="font-bold mb-3 flex items-center gap-2">
                      <ChevronRight className="h-4 w-4" /> {module.labelAr}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {module.permissions.map(perm => (
                        <div key={perm.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm">{perm.labelAr}</span>
                          <Switch 
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
            <div className="h-full flex items-center justify-center border-2 border-dashed rounded-xl p-20 text-gray-400">
              اختر دوراً من القائمة لعرض وتعديل صلاحياته
            </div>
          )}
        </div>
      </div>

      {/* نافذة إنشاء دور جديد */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إنشاء مسمى وظيفي جديد</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input value={newRole.nameAr} onChange={(e) => setNewRole({...newRole, nameAr: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Name (English)</Label>
                <Input value={newRole.name} onChange={(e) => setNewRole({...newRole, name: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الوصف</Label>
              <Textarea value={newRole.descriptionAr} onChange={(e) => setNewRole({...newRole, descriptionAr: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateRole}>إنشاء وحفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
