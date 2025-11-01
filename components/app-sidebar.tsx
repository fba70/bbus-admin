import {
  Route,
  Bus,
  IdCardLanyard,
  Smartphone,
  Home,
  MapPinned,
  FileSpreadsheet,
  Settings,
} from "lucide-react"
import Image from "next/image"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Logout } from "./logout"
import { ModeSwitcher } from "./mode-switcher"
import { getOrganizations } from "@/server/organizations"

export const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Journeys",
    url: "/journeys",
    icon: MapPinned,
  },
  {
    title: "Cards",
    url: "/cards",
    icon: IdCardLanyard,
  },
  {
    title: "Buses",
    url: "/buses",
    icon: Bus,
  },
  {
    title: "Routes",
    url: "/routes",
    icon: Route,
  },
  {
    title: "Apps",
    url: "/apps",
    icon: Smartphone,
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileSpreadsheet,
  },
]

export async function AppSidebar() {
  const organizations = await getOrganizations()

  return (
    <Sidebar className="flex flex-col h-screen">
      <SidebarContent className="flex-1">
        <SidebarHeader className="flex flex-col items-center justify-center gap-2">
          <Image
            src="/Logo_BBUS.png"
            alt="Business Bus"
            width={252}
            height={70}
            className="rounded-lg dark:invert"
          />
          <p className="text-base font-bold text-center">
            {organizations[0].name}
          </p>
        </SidebarHeader>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon size={24} className="mr-2" />
                      <span className="text-lg">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="mt-auto">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a href={"/settings"}>
                <Settings size={24} className="mr-2" />
                <span className="text-lg">Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <ModeSwitcher className="flex items-center justify-start" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Logout />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

// <ModeSwitcher className="flex items-center justify-start" />
