'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, Users, ShieldCheck, 
  Stethoscope, Pill, Wallet, Settings, Hospital 
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePermissions } from '@/hooks/use-permissions'

const NAVIGATION_ITEMS = [
  { title: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard.view' },
  { title: 'الموظفون', href: '/admin/users', icon: Users, permission: 'users.manage' },
  { title: 'الصلاحيات', href: '/admin/roles', icon: ShieldCheck, permission: 'roles.manage' },
  { title: 'التمريض', href: '/clinical/nursing', icon: Stethoscope, permission: 'patients.view' },
  { title: 'الصيدلية', href: '/pharmacy/inventory', icon: Pill, permission: 'inventory.manage' },
  { title: 'الحسابات', href: '/finance/billing', icon: Wallet, permission: 'billing.manage' },
]

export default function AppSidebar() {
  const pathname = usePathname()
  const { hasPermission, isLoading } = usePermissions()

  return (
    <aside className="w-64 bg-slate-900 h-screen flex flex-col text-right" dir="rtl">
      {/* Logo */}
      <div className="p-6 flex items-center justify-between border-b border-slate-800">
        <div className="bg-blue-600 p-2 rounded-lg">
          <Hospital className="h-6 w-6 text-white" />
        </div>
        <span className="text-white font-bold text-xl">نظام تمريض</span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-2 mt-4 overflow-y-auto">
        {NAVIGATION_ITEMS.map((item) => {
          // فحص الصلاحية لكل عنصر
          if (!hasPermission(item.permission)) return null

          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5",
                isActive ? "text-white" : "text-slate-500 group-hover:text-blue-400"
              )} />
              <span className="font-bold">{item.title}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Profile/Settings */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <p className="text-[10px] text-slate-500 text-center mb-2 font-mono">ERP SYSTEM v1.0</p>
      </div>
    </aside>
  )
}
