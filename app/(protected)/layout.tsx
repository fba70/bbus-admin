import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <div className="flex-1 flex flex-col">
        <div className="absolute top-2 right-2">
          <SidebarTrigger />
        </div>

        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </SidebarProvider>
  )
}
