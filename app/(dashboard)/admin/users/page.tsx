'use client'

import * as React from 'react'
import {
  Plus, MoreHorizontal, Edit, Trash2, Shield, UserCog,
  CheckCircle2, XCircle, Clock, Users, UserCheck, UserX, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DataTable, Column } from '@/components/ui/data-table'
import { toast } from 'sonner'
import { useLang } from '@/contexts/lang-context'
import { useAuth } from '@/contexts/auth-context'
import { useFirestoreCollection } from '@/hooks/use-firestore'
import { User, COLLECTIONS } from '@/types'
import { doc, updateDoc, setDoc, deleteDoc, collection } from 'firebase/firestore'
import { getFirestoreDb, isFirebaseConfigured } from '@/lib/firebase'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirebaseAuth } from '@/lib/firebase'

type UserRole = 'super_admin' | 'admin' | 'head_nurse' | 'supervisor' | 'nurse' | 'doctor' | 'receptionist' | 'staff'
type UserStatus = 'active' | 'pending_approval' | 'inactive' | 'suspended'

const DEPARTMENTS = [
  { value: 'admin', labelAr: 'الإدارة', labelEn: 'Administration' },
  { value: 'icu', labelAr: 'العناية المركزة', labelEn: 'ICU' },
  { value: 'er', labelAr: 'الطوارئ', labelEn: 'Emergency' },
  { value: 'internal', labelAr: 'الباطنية', labelEn: 'Internal Medicine' },
  { value: 'surgery', labelAr: 'الجراحة', labelEn: 'Surgery' },
  { value: 'pediatrics', labelAr: 'الأطفال', labelEn: 'Pediatrics' },
  { value: 'obgyn', labelAr: 'النساء والولادة', labelEn: 'OB/GYN' },
  { value: 'orthopedics', labelAr: 'العظام', labelEn: 'Orthopedics' },
]

const ROLE_LABELS: Record<UserRole, { ar: string; en: string; color: string }> = {
  super_admin: { ar: 'المدير العام', en: 'Super Admin', color: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400' },
  admin: { ar: 'مدير النظام', en: 'System Admin', color: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400' },
  head_nurse: { ar: 'رئيس التمريض', en: 'Head Nurse', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400' },
  supervisor: { ar: 'مشرف', en: 'Supervisor', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400' },
  nurse: { ar: 'ممرض/ة', en: 'Nurse', color: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-400' },
  doctor: { ar: 'طبيب/ة', en: 'Doctor', color: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400' },
  receptionist: { ar: 'موظف استقبال', en: 'Receptionist', color: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-400' },
  staff: { ar: 'موظف', en: 'Staff', color: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400' },
}

interface PendingUser {
  id: string
  name: string
  nameAr: string
  email: string
  photoURL?: string
  status: UserStatus
  requestedAt: string
  role?: UserRole
  department?: string
}

/* Approve dialog */
function ApproveDialog({
  entry,
  isAr,
  onDone,
}: {
  entry: PendingUser | null
  isAr: boolean
  onDone: () => void
}) {
  const { user: currentUser } = useAuth()
  const [role, setRole] = React.useState<UserRole>('staff')
  const [dept, setDept] = React.useState('admin')
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => { if (entry) setOpen(true) }, [entry])

  const approve = async () => {
    if (!entry || !isFirebaseConfigured()) return
    setLoading(true)
    
    try {
      const db = getFirestoreDb()
      await updateDoc(doc(db, COLLECTIONS.USERS, entry.id), {
        status: 'active',
        role,
        department: dept,
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser?.id || 'admin',
        updatedAt: new Date().toISOString(),
      })
      
      toast.success(isAr ? `تمت الموافقة على ${entry.name}` : `${entry.name} approved`)
      setOpen(false)
      onDone()
    } catch (error) {
      console.error('[Users] Error approving user:', error)
      toast.error(isAr ? 'حدث خطأ أثناء الموافقة' : 'Error approving user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isAr ? 'الموافقة على الطلب وتحديد الصلاحية' : 'Approve Request & Assign Role'}</DialogTitle>
          <DialogDescription>
            {isAr ? 'حدد الدور والقسم للمستخدم الجديد' : 'Set the role and department for the new user'}
          </DialogDescription>
        </DialogHeader>
        {entry && (
          <div className="space-y-4 py-2">
            {/* User info */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="h-10 w-10">
                {entry.photoURL && <AvatarImage src={entry.photoURL} />}
                <AvatarFallback className="bg-teal-100 text-teal-700 font-bold">
                  {entry.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-sm">{entry.name}</p>
                <p className="text-xs text-muted-foreground">{entry.email}</p>
              </div>
            </div>

            {/* Role */}
            <div className="space-y-2">
              <Label>{isAr ? 'الدور / الصلاحية' : 'Role / Permission'}</Label>
              <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                    <SelectItem key={r} value={r}>
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${ROLE_LABELS[r].color.split(' ')[0]}`} />
                        {isAr ? ROLE_LABELS[r].ar : ROLE_LABELS[r].en}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label>{isAr ? 'القسم' : 'Department'}</Label>
              <Select value={dept} onValueChange={setDept}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{isAr ? d.labelAr : d.labelEn}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role description */}
            <div className={`p-3 rounded-lg border text-sm ${ROLE_LABELS[role].color}`}>
              {role === 'super_admin' && (isAr ? 'صلاحية كاملة على جميع أقسام النظام بدون استثناء' : 'Full access to all system modules without exception')}
              {role === 'admin' && (isAr ? 'صلاحية كاملة على جميع أقسام النظام' : 'Full access to all system modules')}
              {role === 'head_nurse' && (isAr ? 'إدارة الكادر والأقسام وإنشاء التقارير' : 'Manage staff, departments, and reports')}
              {role === 'supervisor' && (isAr ? 'الإشراف على الشيفت وإنشاء تقارير محدودة' : 'Shift supervision and limited reporting')}
              {role === 'nurse' && (isAr ? 'وصول لوحدات التمريض والمرضى' : 'Access to nursing and patient modules')}
              {role === 'doctor' && (isAr ? 'وصول للوحدات الطبية والمرضى' : 'Access to medical and patient modules')}
              {role === 'receptionist' && (isAr ? 'وصول لوحدات الاستقبال والمواعيد' : 'Access to reception and appointments')}
              {role === 'staff' && (isAr ? 'وصول للوحة التحكم ومهام الموظف فقط' : 'Dashboard access and staff tasks only')}
            </div>
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button onClick={approve} className="bg-green-600 hover:bg-green-700 gap-2" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {isAr ? 'موافقة وتفعيل' : 'Approve & Activate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* Main Page */
export default function UsersPage() {
  const { lang } = useLang()
  const { user: currentUser } = useAuth()
  const isAr = lang === 'ar'

  // Firestore users collection
  const { data: firestoreUsers, loading: usersLoading, update: updateUser, remove: removeUser, add: addUser } = useFirestoreCollection<User>(
    COLLECTIONS.USERS,
    [],
    []
  )

  const [roleFilter, setRoleFilter] = React.useState('all')
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [rejectTarget, setRejectTarget] = React.useState<PendingUser | null>(null)
  const [approveTarget, setApproveTarget] = React.useState<PendingUser | null>(null)
  const [editTarget, setEditTarget] = React.useState<User | null>(null)
  const [editRole, setEditRole] = React.useState<UserRole>('staff')
  const [editDept, setEditDept] = React.useState('')
  const [newUser, setNewUser] = React.useState({ 
    name: '', 
    nameAr: '', 
    email: '', 
    password: '',
    employeeCode: '',
    role: 'staff' as UserRole, 
    department: 'admin' 
  })
  const [addLoading, setAddLoading] = React.useState(false)

  // Split users into active and pending
  const activeUsers = firestoreUsers.filter(u => u.status === 'active')
  const pendingUsers = firestoreUsers.filter(u => u.status === 'pending_approval')

  // Filter active users by role
  const filteredUsers = roleFilter === 'all' 
    ? activeUsers 
    : activeUsers.filter(u => u.role === roleFilter)

  // Reject user
  const rejectUser = async (entry: PendingUser) => {
    if (!isFirebaseConfigured()) return
    
    try {
      const db = getFirestoreDb()
      await updateDoc(doc(db, COLLECTIONS.USERS, entry.id), {
        status: 'inactive',
        rejectedAt: new Date().toISOString(),
        rejectedBy: currentUser?.id || 'admin',
        updatedAt: new Date().toISOString(),
      })
      
      toast.error(isAr ? `تم رفض ${entry.name}` : `${entry.name} rejected`)
      setRejectTarget(null)
    } catch (error) {
      console.error('[Users] Error rejecting user:', error)
      toast.error(isAr ? 'حدث خطأ أثناء الرفض' : 'Error rejecting user')
    }
  }

  // Add new user
  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error(isAr ? 'أدخل الاسم والبريد الإلكتروني وكلمة المرور' : 'Enter name, email, and password')
      return
    }
    
    if (!isFirebaseConfigured()) {
      toast.error(isAr ? 'Firebase غير متصل' : 'Firebase not connected')
      return
    }
    
    setAddLoading(true)
    try {
      const auth = getFirebaseAuth()
      const db = getFirestoreDb()
      
      // Create Firebase Auth account
      const result = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password)
      
      // Create Firestore user document
      const userData: Partial<User> = {
        id: result.user.uid,
        name: newUser.name,
        nameAr: newUser.nameAr || newUser.name,
        email: newUser.email,
        employeeCode: newUser.employeeCode.toUpperCase() || `EMP${Date.now().toString().slice(-6)}`,
        role: newUser.role,
        roleId: '',
        department: newUser.department,
        departmentId: '',
        status: 'active',
        phone: '',
        hireDate: new Date().toISOString().split('T')[0],
        mustChangePassword: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser?.id || 'admin',
      }
      
      await setDoc(doc(db, COLLECTIONS.USERS, result.user.uid), userData)
      
      toast.success(isAr ? 'تم إضافة المستخدم بنجاح' : 'User added successfully')
      setIsAddOpen(false)
      setNewUser({ name: '', nameAr: '', email: '', password: '', employeeCode: '', role: 'staff', department: 'admin' })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[Users] Error adding user:', error)
      toast.error(isAr ? 'حدث خطأ أثناء الإضافة' : 'Error adding user', { description: errorMessage })
    } finally {
      setAddLoading(false)
    }
  }

  // Edit role
  const saveEditRole = async () => {
    if (!editTarget || !isFirebaseConfigured()) return
    
    try {
      const db = getFirestoreDb()
      await updateDoc(doc(db, COLLECTIONS.USERS, editTarget.id), {
        role: editRole,
        department: editDept || editTarget.department,
        updatedAt: new Date().toISOString(),
      })
      
      toast.success(isAr ? 'تم تعديل الصلاحية' : 'Role updated')
      setEditTarget(null)
    } catch (error) {
      console.error('[Users] Error updating role:', error)
      toast.error(isAr ? 'حدث خطأ أثناء التعديل' : 'Error updating role')
    }
  }

  // Toggle status
  const toggleStatus = async (user: User) => {
    if (!isFirebaseConfigured()) return
    
    const newStatus = user.status === 'active' ? 'inactive' : 'active'
    try {
      const db = getFirestoreDb()
      await updateDoc(doc(db, COLLECTIONS.USERS, user.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      })
      toast.success(isAr ? 'تم تحديث الحالة' : 'Status updated')
    } catch (error) {
      console.error('[Users] Error toggling status:', error)
    }
  }

  // Delete user
  const handleDeleteUser = async (user: User) => {
    if (!isFirebaseConfigured()) return
    
    try {
      const db = getFirestoreDb()
      // Soft delete - mark as deleted instead of actually removing
      await updateDoc(doc(db, COLLECTIONS.USERS, user.id), {
        status: 'deleted' as UserStatus,
        deletedAt: new Date().toISOString(),
        deletedBy: currentUser?.id || 'admin',
      })
      toast.success(isAr ? 'تم حذف المستخدم' : 'User deleted')
    } catch (error) {
      console.error('[Users] Error deleting user:', error)
      toast.error(isAr ? 'حدث خطأ أثناء الحذف' : 'Error deleting user')
    }
  }

  // Columns for users table
  const userColumns: Column<User>[] = [
    {
      key: 'name',
      header: isAr ? 'المستخدم' : 'User',
      cell: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            {row.avatar && <AvatarImage src={row.avatar} />}
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
              {(row.nameAr || row.name || 'U').charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{isAr ? row.nameAr : row.name}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'employeeCode',
      header: isAr ? 'كود الموظف' : 'Employee Code',
      cell: (row) => <span className="font-mono text-sm">{row.employeeCode || '-'}</span>,
    },
    {
      key: 'role',
      header: isAr ? 'الدور' : 'Role',
      cell: (row) => {
        const roleConfig = ROLE_LABELS[row.role as UserRole] || ROLE_LABELS.staff
        return (
          <Badge variant="outline" className={roleConfig.color}>
            {isAr ? roleConfig.ar : roleConfig.en}
          </Badge>
        )
      },
    },
    {
      key: 'department',
      header: isAr ? 'القسم' : 'Department',
      cell: (row) => {
        const dept = DEPARTMENTS.find(d => d.value === row.department)
        return <span className="text-sm text-muted-foreground">{dept ? (isAr ? dept.labelAr : dept.labelEn) : row.department}</span>
      },
    },
    {
      key: 'status',
      header: isAr ? 'الحالة' : 'Status',
      cell: (row) => (
        <Badge variant="outline" className={row.status === 'active' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400' : 'bg-slate-100 text-slate-500'}>
          {row.status === 'active' ? (isAr ? 'نشط' : 'Active') : (isAr ? 'معطّل' : 'Inactive')}
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
            <DropdownMenuItem onClick={() => { setEditTarget(row); setEditRole(row.role as UserRole); setEditDept(row.department) }}>
              <Shield className="h-4 w-4 ml-2" />
              {isAr ? 'تغيير الصلاحية' : 'Change Role'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toggleStatus(row)}>
              {row.status === 'active'
                ? <><UserX className="h-4 w-4 ml-2" />{isAr ? 'تعطيل الحساب' : 'Deactivate'}</>
                : <><UserCheck className="h-4 w-4 ml-2" />{isAr ? 'تفعيل الحساب' : 'Activate'}</>}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => handleDeleteUser(row)}
            >
              <Trash2 className="h-4 w-4 ml-2" />
              {isAr ? 'حذف' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{isAr ? 'إدارة المستخدمين' : 'User Management'}</h1>
          <p className="text-muted-foreground text-sm">{isAr ? 'إدارة حسابات وصلاحيات مستخدمي النظام' : 'Manage system user accounts and permissions'}</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              {isAr ? 'إضافة مستخدم' : 'Add User'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{isAr ? 'إضافة مستخدم جديد' : 'Add New User'}</DialogTitle>
              <DialogDescription>{isAr ? 'أدخل بيانات المستخدم الجديد' : 'Enter the new user details'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{isAr ? 'الاسم (عربي)' : 'Name (Arabic)'}</Label>
                  <Input value={newUser.nameAr} onChange={(e) => setNewUser({ ...newUser, nameAr: e.target.value })} placeholder="أحمد محمد" />
                </div>
                <div className="space-y-2">
                  <Label>{isAr ? 'الاسم (إنجليزي)' : 'Name (English)'}</Label>
                  <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} placeholder="Ahmed Mohammed" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'البريد الإلكتروني' : 'Email'}</Label>
                <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} placeholder="user@hospital.com" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'كلمة المرور' : 'Password'}</Label>
                <Input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} placeholder="********" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'كود الموظف' : 'Employee Code'}</Label>
                <Input value={newUser.employeeCode} onChange={(e) => setNewUser({ ...newUser, employeeCode: e.target.value.toUpperCase() })} placeholder="EMP001" dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'الدور' : 'Role'}</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                      <SelectItem key={r} value={r}>{isAr ? ROLE_LABELS[r].ar : ROLE_LABELS[r].en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isAr ? 'القسم' : 'Department'}</Label>
                <Select value={newUser.department} onValueChange={(v) => setNewUser({ ...newUser, department: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d.value} value={d.value}>{isAr ? d.labelAr : d.labelEn}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={handleAddUser} disabled={addLoading}>
                {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isAr ? 'إضافة' : 'Add')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: isAr ? 'إجمالي المستخدمين' : 'Total Users', val: firestoreUsers.length, icon: UserCog, bg: 'bg-primary/10', ic: 'text-primary' },
          { label: isAr ? 'نشط' : 'Active', val: activeUsers.length, icon: UserCheck, bg: 'bg-green-100 dark:bg-green-950', ic: 'text-green-600' },
          { label: isAr ? 'بانتظار الموافقة' : 'Pending', val: pendingUsers.length, icon: Clock, bg: 'bg-amber-100 dark:bg-amber-950', ic: 'text-amber-600' },
          { label: isAr ? 'مدراء' : 'Admins', val: firestoreUsers.filter((u) => u.role === 'admin' || u.role === 'super_admin').length, icon: Shield, bg: 'bg-red-100 dark:bg-red-950', ic: 'text-red-600' },
        ].map(({ label, val, icon: Icon, bg, ic }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${ic}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{val}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users">
        <TabsList className="mb-2">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            {isAr ? 'المستخدمون' : 'Users'}
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{activeUsers.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            {isAr ? 'طلبات الموافقة' : 'Approval Requests'}
            {pendingUsers.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs animate-pulse">{pendingUsers.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex gap-3 mb-4">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder={isAr ? 'جميع الأدوار' : 'All roles'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isAr ? 'جميع الأدوار' : 'All roles'}</SelectItem>
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                      <SelectItem key={r} value={r}>{isAr ? ROLE_LABELS[r].ar : ROLE_LABELS[r].en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setRoleFilter('all')}>
                  {isAr ? 'مسح' : 'Reset'}
                </Button>
              </div>
              <DataTable
                columns={userColumns}
                data={filteredUsers}
                searchKey="nameAr"
                searchPlaceholder={isAr ? 'بحث بالاسم...' : 'Search by name...'}
                emptyMessage={isAr ? 'لا يوجد مستخدمون' : 'No users found'}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-4">
          {pendingUsers.length === 0 ? (
            <Card>
              <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <p className="font-semibold">{isAr ? 'لا توجد طلبات معلقة' : 'No pending requests'}</p>
                <p className="text-sm text-muted-foreground">
                  {isAr ? 'سيظهر هنا أي مستخدم سجّل دخولاً عبر Google وينتظر موافقتك' : 'Google sign-in requests awaiting your approval will appear here'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((entry) => (
                <Card key={entry.id} className="border-amber-200 dark:border-amber-800 shadow-sm">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* User info */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-11 w-11 shrink-0">
                          {entry.avatar && <AvatarImage src={entry.avatar} />}
                          <AvatarFallback className="bg-teal-100 text-teal-700 font-bold text-base">
                            {(entry.nameAr || entry.name || 'U').charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{entry.nameAr || entry.name}</p>
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 text-[10px] gap-1">
                              <Clock className="h-3 w-3" />
                              {isAr ? 'بانتظار الموافقة' : 'Pending'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{entry.email}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {isAr ? 'طلب في:' : 'Requested:'} {new Date(entry.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 gap-1.5"
                          onClick={() => setApproveTarget({ 
                            id: entry.id, 
                            name: entry.name, 
                            nameAr: entry.nameAr,
                            email: entry.email, 
                            photoURL: entry.avatar,
                            status: 'pending_approval',
                            requestedAt: entry.createdAt,
                          })}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          {isAr ? 'موافقة' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 gap-1.5"
                          onClick={() => setRejectTarget({ 
                            id: entry.id, 
                            name: entry.name, 
                            nameAr: entry.nameAr,
                            email: entry.email, 
                            photoURL: entry.avatar,
                            status: 'pending_approval',
                            requestedAt: entry.createdAt,
                          })}
                        >
                          <XCircle className="h-4 w-4" />
                          {isAr ? 'رفض' : 'Reject'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approve dialog */}
      <ApproveDialog
        entry={approveTarget}
        isAr={isAr}
        onDone={() => setApproveTarget(null)}
      />

      {/* Reject confirm */}
      <AlertDialog open={!!rejectTarget} onOpenChange={() => setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAr ? 'رفض الطلب' : 'Reject Request'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAr
                ? `هل أنت متأكد من رفض طلب ${rejectTarget?.name}؟ لن يتمكن من الدخول للنظام.`
                : `Are you sure you want to reject ${rejectTarget?.name}? They will not be able to access the system.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => rejectTarget && rejectUser(rejectTarget)}
            >
              {isAr ? 'رفض' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit role dialog */}
      <Dialog open={!!editTarget} onOpenChange={() => setEditTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isAr ? 'تغيير الصلاحية' : 'Change Role'}</DialogTitle>
            <DialogDescription>{editTarget?.nameAr || editTarget?.name} - {editTarget?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{isAr ? 'الدور الجديد' : 'New Role'}</Label>
              <Select value={editRole} onValueChange={(v) => setEditRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
                    <SelectItem key={r} value={r}>{isAr ? ROLE_LABELS[r].ar : ROLE_LABELS[r].en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{isAr ? 'القسم' : 'Department'}</Label>
              <Select value={editDept} onValueChange={setEditDept}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{DEPARTMENTS.map((d) => <SelectItem key={d.value} value={d.value}>{isAr ? d.labelAr : d.labelEn}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={saveEditRole}>{isAr ? 'حفظ' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
