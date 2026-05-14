'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Hospital } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navigationConfig } from '@/config/navigation' // الملف الضخم اللي فيه كل الأقسام

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen flex flex-col border-l border-slate-800 shadow-2xl transition-all duration-300" dir="rtl">
      {/* الهيدر الثابت */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="bg-teal-600 p-2 rounded-lg shadow-lg shadow-teal-900/20">
          <Hospital className="h-6 w-6 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">PRO Nurse</span>
      </div>
      
      {/* القائمة القابلة للتمرير */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {navigationConfig.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {/* عنوان المجموعة بالعربي (مثل: الموارد البشرية) */}
            <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
              {group.titleAr}
            </h3>
            
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link 
                    key={item.href} 
                    href={item.href} 
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group",
                      isActive 
                        ? "bg-teal-600 text-white shadow-lg shadow-teal-900/40" 
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <Icon size={18} className={cn(
                      "transition-colors",
                      isActive ? "text-white" : "group-hover:text-teal-400"
                    )} />
                    <span className="font-medium text-sm">{item.titleAr}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* فوتر بسيط للمستخدم */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3 px-2">
          <div className="h-8 w-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[10px]">
            AD
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold truncate">مدير النظام</span>
            <span className="text-[10px] text-slate-500 truncate">admin@pronurse.com</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
