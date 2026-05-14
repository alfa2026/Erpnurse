'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Hospital, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navigationConfig } from '@/config/navigation' // ربط ملف الـ 40 صفحة
import { useAuth } from '@/contexts/auth-context' // ربط الصلاحيات
import { useSidebar } from "@/components/ui/sidebar" // ربط زر الفتح والغلق

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

export function AppSidebar() {
  const pathname = usePathname()
  const { user, hasPermission } = useAuth()
  const { state } = useSidebar() // دي اللي بتسمع كلام زرار الفتح والقفل

  return (
    <aside 
      className={cn(
        "bg-slate-900 text-white h-screen flex flex-col border-l border-slate-800 transition-all duration-300",
        state === "collapsed" ? "w-[70px]" : "w-64"
      )} 
      dir="rtl"
    >
      {/* الهيدر - اللوجو */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-900 sticky top-0 z-20">
        <div className="bg-teal-600 p-2 rounded-lg shadow-lg">
          <Hospital className="h-6 w-6 text-white" />
        </div>
        {state !== "collapsed" && (
          <span className="font-bold text-lg tracking-tight animate-in fade-in duration-300">
            PRO Nurse
          </span>
        )}
      </div>
      
      {/* القائمة - هنا السحر كله */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {navigationConfig.map((group, groupIdx) => (
          <Collapsible key={groupIdx} defaultOpen className="group/collapsible">
            {/* عنوان المجموعة (موارد بشرية، طوارئ...) */}
            {state !== "collapsed" && (
              <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-teal-400 transition-colors">
                <span>{group.titleAr}</span>
                <ChevronDown size={14} className="transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </CollapsibleTrigger>
            )}

            <CollapsibleContent className="space-y-1 mt-2">
              {group.items.map((item) => {
                // فحص الصلاحيات: لو أدمن يفتح كله، لو موظف يشوف المسموح له بس
                const canView = user?.role === 'admin' || !item.permission || hasPermission(item.permission as any)
                
                if (!canView) return null

                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    title={item.titleAr}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                      isActive 
                        ? "bg-teal-600 text-white shadow-lg shadow-teal-900/40" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-white",
                      state === "collapsed" && "justify-center px-0"
                    )}
                  >
                    <Icon size={20} className={cn(isActive ? "text-white" : "group-hover:text-teal-400")} />
                    {state !== "collapsed" && (
                      <span className="font-medium text-sm truncate">{item.titleAr}</span>
                    )}
                  </Link>
                )
              })}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </nav>

      {/* الجزء السفلي - بيانات المستخدم */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-teal-600 flex items-center justify-center font-bold text-white text-xs shadow-inner">
            {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
          </div>
          {state !== "collapsed" && (
            <div className="flex flex-col overflow-hidden animate-in fade-in">
              <span className="text-xs font-bold truncate text-slate-100">{user?.name || 'مدير النظام'}</span>
              <span className="text-[10px] text-slate-500 truncate">{user?.role === 'admin' ? 'صلاحيات كاملة' : 'موظف'}</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
