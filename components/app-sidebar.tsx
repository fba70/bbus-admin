"use client"

import { useEffect, useState } from "react"
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
import { usePathname } from "next/navigation"
import { getOrganizations } from "@/server/organizations"

export const items = [
  {
    title: "Главная",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Поездки",
    url: "/journeys",
    icon: MapPinned,
  },
  {
    title: "Карты",
    url: "/cards",
    icon: IdCardLanyard,
  },
  {
    title: "Автобусы",
    url: "/buses",
    icon: Bus,
  },
  {
    title: "Маршруты",
    url: "/routes",
    icon: Route,
  },
  {
    title: "Приложения",
    url: "/apps",
    icon: Smartphone,
  },
  {
    title: "Отчеты",
    url: "/reports",
    icon: FileSpreadsheet,
  },
  {
    title: "Настройки",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  const [organization, setOrganization] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const organizations = await getOrganizations()
        setOrganization(organizations[0]?.name || "Unknown Organization")
      } catch (error) {
        console.error("Failed to fetch organization data:", error)
        setOrganization("Error Loading Organization")
      }
    }

    fetchOrganization()
  }, [])
  // {organizations[0].name}

  return (
    <Sidebar className="flex flex-col h-screen">
      <SidebarContent className="flex-1">
        <SidebarHeader className="flex flex-col items-center justify-center gap-2">
          <Image
            src="/Logo_BBUS.png"
            alt="Business Bus"
            width={252}
            height={70}
            className="rounded-lg dark:bg-gray-200"
          />
          <p className="text-2xl font-bold text-center">
            {organization || "Loading..."}
          </p>
        </SidebarHeader>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a
                      href={item.url}
                      className={`flex items-center p-2 rounded-md ${
                        pathname === item.url
                          ? "bg-gray-200 dark:bg-gray-700 text-blue-600"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
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
      <SidebarFooter className="mt-auto mb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <ModeSwitcher className="flex items-center justify-start" />
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a
                href={"/settings"}
                className={`flex items-center p-2 rounded-md ${
                  pathname === "/user-settings"
                    ? "bg-gray-200 dark:bg-gray-700 text-blue-600"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <Settings size={24} className="mr-2" />
                <span className="text-lg">Пользователь</span>
              </a>
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
