'use client'

import * as React from 'react'
import {
  MoreHorizontal, CheckCircle2, Clock, Users, Trash2, Shield, UserX, UserCheck
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { DataTable, Column } from '@/components/ui/data-table'
import { toast } from 'sonner'
import { useFirestoreCollection } from '@/hooks/use-firestore'
import { COLLECTIONS, User } from '@/types'

export default function UsersPage() {
  // 1. جلب المستخدمين والأدوار لحظياً
  const { data: allUsers, loading: usersLoading, update: updateRecord, remove: deleteRecord } = useFirestoreCollection(COLLECTIONS.USERS)
  const { data: rolesData, loading: rolesLoading } = useFirestoreCollection(COLLECTIONS.ROLES)

  const [selectedUser, setSelectedUser] = React.useState<User | null>(null)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = React.useState(false)
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>("")

  // تصفية المستخدمين (نشط / معلق)
  const activeUsers = allUsers.filter(u => u.status === 'active')
  const pendingUsers = allUsers.filter(u => u.status === 'pending_approval' || u.status === 'pending')

  // دالة فتح نافذة الموافقة
  const handleApproveClick = (user: User) => {
    setSelectedUser(user)
    setIsApproveDialogOpen(true)
  }

  // دالة الحفظ النهائي للموافقة وربط الدور
  const handleFinalApprove = async () => {
    if (!selectedUser || !selectedRoleId) {
      toast.error('يرجى اختيار دور وظيفي للموظف');
      return;
    }
    
    const roleDoc = rolesData.find(r => r.id === selectedRoleId)

    try {
      await updateRecord(selectedUser.id, { 
        status: 'active',
        roleId: selectedRoleId, // ID الدور من صفحة Roles
        role: roleDoc?.name || 'Staff', 
        updatedAt: new Date().toISOString() 
      })
      toast.success(`تم تفعيل حساب ${selectedUser.nameAr || selectedUser.name} بنجاح`);
      setIsApproveDialogOpen(false);
      setSelectedRoleId("");
    } catch (error) {
      toast.error('حدث خطأ أثناء تحديث البيانات');
    }
  }

  // دالة لعرض الـ Badge الخاص بالدور بناءً على اللون اللي اخترته في صفحة Roles
  const getRoleBadge = (user: User) => {
    const role = rolesData.find(r => r.id === user.roleId)
    if (role) {
      return (
        <Badge 
          variant="outline" 
          style={{ 
            backgroundColor: `${role.color}10`, // شفافية 10%
            color: role.color, 
            borderColor: role.color 
          }}
        >
          {role.nameAr}
        </Badge>
      )
    }
    return <Badge variant="secondary">{user.role || 'بدون دور'}</Badge>
  }

  const userColumns: Column<User>[] = [
    {
      key: 'name',
      header: 'الموظف',
      cell: (row) => (
        <div className="flex items-center gap-3 text-right">
          <Avatar className="h-10 w-10 border">
            <AvatarImage src={row.avatar} />
            <AvatarFallback>{(row.nameAr || 'م').charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-bold text-sm">{row.nameAr || row.name}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'roleId',
      header: 'المسمى الوظيفي',
      cell: (row) => getRoleBadge(row),
    },
    {
      key: 'status',
      header: 'الحالة',
      cell: (row) => (
        <Badge className={row.status === 'active' ? 'bg-green-500' : 'bg-amber-500'}>
          {row.status === 'active' ? 'نشط' : 'في انتظار الموافقة'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'إجراءات',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="text-right">
            {row.status !== 'active' && (
              <DropdownMenuItem onClick={() => handleApproveClick(row)} className="text-green-600 cursor-pointer">
                <UserCheck className="h-4 w-4 ml-2" /> موافقة وتعيين دور
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => deleteRecord(row.id)} className="text-red-600 cursor-pointer">
              <Trash2 className="h-4 w-4 ml-2" /> حذف الموظف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (usersLoading || rolesLoading) return <div className="p-20 text-center font-bold">جاري تحميل بيانات الموظفين...</div>

  return (
    <div className="space-y-6 p-6" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">إدارة طاقم العمل</h1>
      </div>

      {/* الاحصائيات السريعة */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-r-4 border-r-green-500 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">موظفين نشطين</p>
              <h3 className="text-3xl font-bold text-green-600">{activeUsers.length}</h3>
            </div>
            <UserCheck className="h-10 w-10 text-green-100" />
          </CardContent>
        </Card>
        <Card className="border-r-4 border-r-amber-500 shadow-sm">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">طلبات معلقة</p>
              <h3 className="text-3xl font-bold text-amber-600">{pendingUsers.length}</h3>
            </div>
            <Clock className="h-10 w-10 text-amber-100" />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="active">الموظفين المعتمدين ({activeUsers.length})</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            طلبات الانضمام ({pendingUsers.length})
            {pendingUsers.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3 bg-red-500 rounded-full" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <DataTable columns={userColumns} data={activeUsers} searchKey="nameAr" />
        </TabsContent>

        <TabsContent value="pending">
          <DataTable columns={userColumns} data={pendingUsers} searchKey="nameAr" />
        </TabsContent>
      </Tabs>

      {/* نافذة اختيار الدور والموافقة */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent className="sm:max-w-[450px]" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl">تفعيل حساب الموظف</DialogTitle>
            <DialogDescription>
              يجب اختيار مسمى وظيفي (Role) لتعيين الصلاحيات المناسبة لهذا الموظف.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6 space-y-5">
            {/* عرض بيانات الموظف المختبر */}
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border">
              <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                <AvatarImage src={selectedUser?.avatar}/>
              </Avatar>
              <div>
                <p className="font-bold text-slate-900">{selectedUser?.nameAr || selectedUser?.name}</p>
                <p className="text-xs text-slate-500">{selectedUser?.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700">اختر المسمى الوظيفي (الأدوار المتاحة):</Label>
              <Select onValueChange={setSelectedRoleId} value={selectedRoleId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="اختر من الأدوار التي أنشأتها..." />
                </SelectTrigger>
                <SelectContent>
                  {rolesData.length === 0 ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">لا توجد أدوار، قم بإنشائها أولاً</div>
                  ) : (
                    rolesData.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: role.color }} />
                          {role.nameAr}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)} className="flex-1">إلغاء</Button>
            <Button onClick={handleFinalApprove} disabled={!selectedRoleId} className="flex-1 bg-green-600 hover:bg-green-700">تفعيل الحساب</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
