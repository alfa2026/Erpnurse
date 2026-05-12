'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, UserCheck, Clock, Shield, TrendingUp } from 'lucide-react'

interface AdminDashboardStatsProps {
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  adminUsers: number
  isAr: boolean
}

export function AdminDashboardStats({
  totalUsers,
  activeUsers,
  pendingUsers,
  adminUsers,
  isAr,
}: AdminDashboardStatsProps) {
  const stats = [
    {
      label: isAr ? 'إجمالي المستخدمين' : 'Total Users',
      value: totalUsers,
      icon: Users,
      bg: 'bg-blue-100 dark:bg-blue-950',
      color: 'text-blue-600 dark:text-blue-400',
      trend: '+12%',
    },
    {
      label: isAr ? 'مستخدمون نشطون' : 'Active Users',
      value: activeUsers,
      icon: UserCheck,
      bg: 'bg-green-100 dark:bg-green-950',
      color: 'text-green-600 dark:text-green-400',
      trend: '+8%',
    },
    {
      label: isAr ? 'في انتظار الموافقة' : 'Pending Approval',
      value: pendingUsers,
      icon: Clock,
      bg: 'bg-amber-100 dark:bg-amber-950',
      color: 'text-amber-600 dark:text-amber-400',
      trend: '0',
    },
    {
      label: isAr ? 'المسؤولون' : 'Administrators',
      value: adminUsers,
      icon: Shield,
      bg: 'bg-purple-100 dark:bg-purple-950',
      color: 'text-purple-600 dark:text-purple-400',
      trend: '+1',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => {
        const Icon = stat.icon
        return (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {isAr ? 'زيادة ' : 'Up '}{stat.trend}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
