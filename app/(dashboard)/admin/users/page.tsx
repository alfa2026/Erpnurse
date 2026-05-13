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
import { DataTable, Column } from '@/components/ui/data-table'
import { toast } from 'sonner'
import { useLang } from '@/contexts/lang-context'
import { useFirestoreCollection } from '@/hooks/use-firestore'
import { COLLECTIONS, UserRole } from '@/types'

const ROLE_LABELS: Record<string, { ar: string; en: string; color: string }> = {
  super_admin: { ar: 'مدير نظام', en: 'Super Admin', color: 'bg-red-100 text-red-700' },
  admin: { ar: 'مسؤول', en: 'Admin', color: 'bg-orange-100 text-orange-700' },
  nurse: { ar: 'ممرض/ة', en: 'Nurse', color: 'bg-blue-100 text-blue-700' },
  staff: { ar: 'موظف', en: 'Staff', color: 'bg-slate-100 text-slate-700' },
}

export default function UsersPage() {
  const { lang } = useLang()
  const isAr = lang === 'ar'
  
  // جلب كافة المستخدمين لحظياً من Firestore
  const { data: allUsers, loading, updateRecord, deleteRecord } = useFirestoreCollection(COLLECTIONS.USERS)

  // تصفية المستخدمين النشطين والمعلقين
  const activeUsers = allUsers.filter(u => u.status === 'active')
  const pendingUsers = allUsers.filter(u => u.status === 'pending_approval' || u.status === 'pending')

  // دالة الموافقة (تحويل الحالة لنشط)
  const handleApprove = async (userId: string) => {
    try {
      await updateRecord(userId, { 
        status: 'active',
        updatedAt: new Date().toISOString() 
      })
      toast.success(isAr ? 'تم تفعيل الحساب بنجاح' : 'Account activated successfully')
    } catch (error) {
      toast.error('حدث خطأ أثناء التفعيل')
    }
  }

  // دالة الحذف أو الرفض
  const handleDelete = async (userId: string) => {
    if (confirm(isAr ? 'هل أنت متأكد من حذف هذا المستخدم؟' : 'Are you sure?')) {
      await deleteRecord(userId)
      toast.info(isAr ? 'تم الحذف' : 'Deleted')
    }
  }

  const userColumns: Column<any>[] = [
    {
      key: 'name',
      header: isAr ? 'المستخدم' : 'User',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={row.photoURL} />
            <AvatarFallback>{row.name?.charAt(0) || row.displayName?.charAt(0)}</AvatarFallback>
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
      cell: (row) => (
        <Badge variant="outline" className={ROLE_LABELS[row.role]?.color || ''}>
          {isAr ? ROLE_LABELS[row.role]?.ar : ROLE_LABELS[row.role]?.en}
        </Badge>
      ),
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
              <DropdownMenuItem onClick={() => handleApprove(row.id)} className="text-green-600">
                <CheckCircle2 className="h-4 w-4 ml-2" />
                {isAr ? 'موافقة وتفعيل' : 'Approve'}
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Users className="text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{activeUsers.length}</p>
                <p className="text-sm text-muted-foreground">{isAr ? 'موظف نشط' : 'Active Staff'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-100">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{pendingUsers.length}</p>
                <p className="text-sm text-muted-foreground">{isAr ? 'طلبات معلقة' : 'Pending Requests'}</p>
              </div>
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
          <DataTable 
            columns={userColumns} 
            data={activeUsers} 
            searchKey="name" 
            searchPlaceholder={isAr ? 'بحث بالاسم...' : 'Search...'}
          />
        </TabsContent>

        <TabsContent value="pending">
          <DataTable 
            columns={userColumns} 
            data={pendingUsers} 
            searchKey="name" 
            searchPlaceholder={isAr ? 'بحث بالاسم...' : 'Search...'}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// جلب الأدوار الديناميكية من Firestore
const { data: dynamicRoles } = useFirestoreCollection('roles')

// تحويل الأدوار لشكل يمكن استخدامه في الجدول
const rolesMap = React.useMemo(() => {
  const map: Record<string, any> = {}
  dynamicRoles.forEach(role => {
    map[role.id] = { ar: role.nameAr, en: role.nameEn, color: role.color || 'bg-slate-100' }
  })
  return map
}, [dynamicRoles])
