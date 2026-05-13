'use client'

import * as React from 'react'
import {
  Plus, MoreHorizontal, Shield, UserCog,
  CheckCircle2, XCircle, Clock, Users, UserCheck, UserX, Trash2, Search
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select'
import { DataTable, Column } from '@/components/ui/data-table'
import { toast } from 'sonner'
import { useLang } from '@/contexts/lang-context'
import { useFirestoreCollection } from '@/hooks/use-firestore'
import { COLLECTIONS } from '@/types'

export default function UsersPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  
  // 1. جلب المستخدمين لحظياً
  const { data: allUsers, loading, update: updateRecord, remove: deleteRecord } = useFirestoreCollection(COLLECTIONS.USERS)
  
  // 2. جلب الأدوار الديناميكية التي أنشأناها في الخطوة السابقة
  const { data: rolesData } = useFirestoreCollection(COLLECTIONS.ROLES)

  const [selectedUser, setSelectedUser] = React.useState<any>(null)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = React.useState(false)
  const [selectedRoleId, setSelectedRoleId] = React.useState<string>("")

  // تصفية المستخدمين
  const activeUsers = allUsers.filter(u => u.status === 'active')
  const pendingUsers = allUsers.filter(u => u.status === 'pending_approval' || u.status === 'pending' || !u.status)

  // دالة فتح نافذة الموافقة
  const openApproveDialog = (user: any) => {
    setSelectedUser(user)
    setIsApproveDialogOpen(true)
  }

  // دالة الموافقة النهائية والربط بالدور
  const handleFinalApprove = async () => {
    if (!selectedRoleId) return toast.error(isAr ? 'يرجى اختيار دور أولاً' : 'Please select a role')
    
    try {
      await updateRecord(selectedUser.id, { 
        status: 'active',
        role: selectedRoleId,
        updatedAt: new Date().toISOString() 
      })
      toast.success(isAr ? 'تم تفعيل الحساب بنجاح' : 'Account activated successfully')
      setIsApproveDialogOpen(false)
      setSelectedRoleId("")
    } catch (error) {
      toast.error('Error updating user')
    }
  }

  const handleDelete = async (userId: string) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure?')) {
      await deleteRecord(userId)
      toast.info(isAr ? 'تم الحذف' : 'Deleted')
    }
  }

  // دالة مساعدة لعرض اسم الدور ولونه بناءً على البيانات الديناميكية
  const getRoleBadge = (roleId: string) => {
    const role = rolesData.find(r => r.id === roleId || r.name === roleId)
    if (!role) return <Badge variant="outline">{roleId || 'No Role'}</Badge>
    
    return (
      <Badge style={{ backgroundColor: (role.color || '#6366f1') + '20', color: role.color || '#6366f1', borderColor: role.color }}>
        {isAr ? role.nameAr : role.name}
      </Badge>
    )
  }

  const userColumns: Column<any>[] = [
    {
      key: 'name',
      header: isAr ? 'المستخدم' : 'User',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={row.photoURL} />
            <AvatarFallback>{(row.name || row.displayName || 'U').charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{row.name || row.displayName}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: isAr ? 'الدور' : 'Role',
      cell: (row) => getRoleBadge(row.role),
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      cell: (row) => (
        <Badge className={row.status === 'active' ? 'bg-green-500' : 'bg-amber-500'}>
          {row.status === 'active' ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معلق' : 'Pending')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: isAr ? 'الإجراءات' : 'Actions',
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {row.status !== 'active' && (
              <DropdownMenuItem onClick={() => openApproveDialog(row)} className="text-green-600">
                <CheckCircle2 className="h-4 w-4 ml-2" />
                {isAr ? 'موافقة وتعيين دور' : 'Approve & Assign Role'}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => handleDelete(row.id)} className="text-red-600">
              <Trash2 className="h-4 w-4 ml-2" />
              {isAr ? 'حذف' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (loading) return <div className="p-10 text-center">{isAr ? 'جاري التحميل...' : 'Loading...'}</div>

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{isAr ? 'إدارة طاقم العمل' : 'Staff Management'}</h1>
      </div>

      {/* Cards Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100">
          <CardContent className="pt-4 flex items-center gap-3">
            <Users className="text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{activeUsers.length}</p>
              <p className="text-sm text-muted-foreground">{isAr ? 'موظف نشط' : 'Active Staff'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-100">
          <CardContent className="pt-4 flex items-center gap-3">
            <Clock className="text-amber-600" />
            <div>
              <p className="text-2xl font-bold">{pendingUsers.length}</p>
              <p className="text-sm text-muted-foreground">{isAr ? 'طلبات معلقة' : 'Pending Requests'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">{isAr ? 'الموظفين' : 'Staff'}</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            {isAr ? 'الطلبات الجديدة' : 'New Requests'}
            {pendingUsers.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                {pendingUsers.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <DataTable columns={userColumns} data={activeUsers} searchKey="name" />
        </TabsContent>

        <TabsContent value="pending">
          <DataTable columns={userColumns} data={pendingUsers} searchKey="name" />
        </TabsContent>
      </Tabs>

      {/* نافذة اختيار الدور عند الموافقة */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isAr ? 'الموافقة على الموظف' : 'Approve User'}</DialogTitle>
            <DialogDescription>
              {isAr ? 'يجب تعيين مسمى وظيفي (دور) لهذا المستخدم قبل تفعيله.' : 'Assign a role to this user to activate their account.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-slate-50">
              <Avatar><AvatarImage src={selectedUser?.photoURL}/></Avatar>
              <div>
                <p className="font-bold">{selectedUser?.name || selectedUser?.displayName}</p>
                <p className="text-xs text-muted-foreground">{selectedUser?.email}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{isAr ? 'اختر المسمى الوظيفي:' : 'Select Job Role:'}</label>
              <Select onValueChange={setSelectedRoleId} value={selectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder={isAr ? 'اختر من الأدوار المتاحة' : 'Select a role'} />
                </SelectTrigger>
                <SelectContent>
                  {rolesData.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {isAr ? role.nameAr : role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleFinalApprove} disabled={!selectedRoleId}>{isAr ? 'تأكيد وتفعيل' : 'Confirm & Activate'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
