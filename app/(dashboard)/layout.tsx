import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { DataProvider } from '@/contexts/data-context' // ضيف ده

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider> 
      <DashboardLayout>{children}</DashboardLayout>
    </DataProvider>
  )
}
