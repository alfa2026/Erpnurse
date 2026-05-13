'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, ShieldCheck, Hospital } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'

// التصدير هنا Named Export عشان يطابق الـ Dashboard Layout
export function AppSidebar() {
  const pathname = usePathname()
  const { hasPermission } = useAuth()

  const navItems = [
    { title: 'الرئيسية', href: '/dashboard', icon: LayoutDashboard, perm: 'dashboard.view' },
    { title: 'الموظفين', href: '/admin/users', icon: Users, perm: 'users.view' },
    { title: 'الصلاحيات', href: '/admin/roles', icon: ShieldCheck, perm: 'roles.manage' },
  ]

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen flex flex-col border-l border-slate-800" dir="rtl">
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-teal-600 p-2 rounded-lg">
          <Hospital className="h-6 w-6 text-white" />
        </div>
        <span className="font-bold text-lg">PRO Nurse</span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 mt-4">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href} 
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
              pathname === item.href ? "bg-teal-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.title}</span>
          </Link>
        ))}
      </nav>
    </aside>
  )
}
