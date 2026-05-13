'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Users, ShieldCheck, 
  Stethoscope, Pill, Wallet, Hospital 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permissions'

const NAVIGATION_ITEMS = [
  { title: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { title: 'الموظفون', href: '/admin/users', icon: Users, permission: 'users.manage' },
  { title: 'الصلاحيات', href: '/admin/roles', icon: ShieldCheck, permission: 'roles.manage' },
  { title: 'التمريض', href: '/clinical/nursing', icon: Stethoscope, permission: 'patients.view' },
  { title: 'الصيدلية', href: '/pharmacy/inventory', icon: Pill, permission: 'inventory.manage' },
  { title: 'الحسابات', href: '/finance/billing', icon: Wallet, permission: 'payroll.manage' },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const { hasPermission } = usePermissions()

  return (
    <aside className="w-64 bg-slate-900 h-screen flex flex-col text-right border-l border-slate-800" dir="rtl">
      <div className="p-6 flex items-center justify-between border-b border-slate-800">
        <div className="bg-indigo-600 p-2 rounded-lg"><Hospital className="h-6 w-6 text-white" /></div>
        <span className="text-white font-bold text-lg">PRO NURSE ERP</span>
      </div>

      <nav className="flex-1 p-4 space-y-1 mt-4">
        {NAVIGATION_ITEMS.map((item) => {
          if (!hasPermission(item.permission)) return null
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
              isActive ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}>
              <item.icon className="h-5 w-5" />
              <span className="font-bold">{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
