"use client"

import React, { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { unauthorized } from "next/navigation"
import Loading from "@/app/loading"
import {
  getJourneysWithFilters,
  JourneyWithoutOrganization,
} from "@/server/orders"

type ChartData = {
  day: string
  journeys: number
}

export default function DashboardPage() {
  const { data: user, isPending } = authClient.useSession()

  // console.log("Authenticated user:", user)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  if (!user && !isPending) {
    unauthorized()
  }

  const [chartData, setChartData] = useState<ChartData[]>([])
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const [loading, setLoading] = useState(true)

  const [hasFetchedInitial, setHasFetchedInitial] = useState(false)

  const [stats, setStats] = useState({
    accessCards: 0,
    buses: 0,
    routes: 0,
    journeys: 0,
    organizations: 0,
  })

  // Generate month options starting from November 2025
  const firstMonth = new Date(2025, 11, 1) // November 2025
  const now = new Date()
  // Calculate how many months to show: from November 2025 up to now, max 12
  const monthsSinceFirst =
    (now.getFullYear() - 2025) * 12 + (now.getMonth() - 10)
  const monthsToShow = Math.min(Math.max(monthsSinceFirst + 1, 1), 12)
  const monthOptions = Array.from({ length: monthsToShow }, (_, i) => {
    const date = new Date(2025, 10, 1)
    date.setMonth(date.getMonth() + i)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const label = date.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
    })
    return { value, label }
  })

  const fetchJourneys = async (startTime: string, endTime: string) => {
    const journeys = await getJourneysWithFilters([], [], startTime, endTime)
    const preparedChartData = prepareChartData(journeys)
    setChartData(preparedChartData)
  }

  /*
  useEffect(() => {
    const [year, month] = selectedMonth.split("-").map(Number)
    const startTime = new Date(year, month - 1, 1).toISOString()
    const endTime = new Date(year, month, 0).toISOString() // Last day of month
    fetchJourneys(startTime, endTime)
  }, [selectedMonth])
*/

  useEffect(() => {
    if (user && !loading && !hasFetchedInitial) {
      const [year, month] = selectedMonth.split("-").map(Number)
      const startTime = new Date(year, month - 1, 1).toISOString()
      const endTime = new Date(year, month, 0).toISOString()
      fetchJourneys(startTime, endTime)
      setHasFetchedInitial(true)
    }
  }, [user, loading, selectedMonth, hasFetchedInitial])

  useEffect(() => {
    if (user && user.user.id) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)

      if (!user || !user.user.id) {
        throw new Error("User is not authenticated.")
      }

      // Fetch total counts for each API using axios
      /*
      const [
        accessCardsRes,
        busesRes,
        routesRes,
        organizationsRes,
        journeysRes,
      ] = await Promise.all([
        axios.get(`${baseUrl}/api/access-cards`, {
          params: { userId: user.user.id },
        }),
        axios.get(`${baseUrl}/api/buses`, {
          params: { userId: user.user.id },
        }),
        axios.get(`${baseUrl}/api/routes`, {
          params: { userId: user.user.id },
        }),
        axios.get(`${baseUrl}/api/clients`, {
          params: { userId: user.user.id },
        }),
        axios.get(`${baseUrl}/api/journeys`, {
          params: { sessionUserId: user.user.id },
        }),
      ])
        */

      const fetchedStats = await axios.get(`${baseUrl}/api/stats`, {
        params: { userId: user.user.id },
      })

      console.log("Fetched stats:", fetchedStats.data)

      const journeysRes = await axios.get(`${baseUrl}/api/journeys`, {
        params: { sessionUserId: user.user.id },
      })

      // Update state with total counts
      setStats({
        accessCards: fetchedStats.data.accessCards,
        buses: fetchedStats.data.buses,
        routes: fetchedStats.data.routes,
        organizations: fetchedStats.data.organizations,
        journeys: fetchedStats.data.journeys,
      })

      // console.log("Routes", routesRes.data)

      const preparedChartData = prepareChartData(journeysRes.data)
      setChartData(preparedChartData)
      setLoading(false)
      // console.log("Chart data:", preparedChartData)
    } catch (error) {
      console.error("Error fetching data:", error)
    }
  }

  const chartConfig = {
    journeys: {
      label: "journeys",
      color: "#2563eb",
    },
  } satisfies ChartConfig

  function prepareChartData(journeys: JourneyWithoutOrganization[]) {
    const journeyCountByDay: Record<string, number> = {}

    journeys.forEach((journey) => {
      const day = new Date(journey.createdAt).toISOString().split("T")[0]

      if (journeyCountByDay[day]) {
        journeyCountByDay[day]++
      } else {
        journeyCountByDay[day] = 1
      }
    })

    const chartData = Object.entries(journeyCountByDay).map(([day, count]) => ({
      day,
      journeys: count,
    }))

    return chartData
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="flex flex-col gap-2 items-center justify-start h-screen">
      <h1 className="text-2xl font-bold my-4">Главная страница</h1>

      <h2 className="text-xl font-bold mt-6 mb-4">Общая статистика</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="w-[160px]">
          <CardHeader>
            <CardTitle className="text-center">Клиентов</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-center">
              {stats.organizations}
            </p>
          </CardContent>
        </Card>
        <Card className="w-[160px]">
          <CardHeader>
            <CardTitle className="text-center">Карт доступа</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-center">
              {stats.accessCards}
            </p>
          </CardContent>
        </Card>
        <Card className="w-[160px]">
          <CardHeader>
            <CardTitle className="text-center">Автобусов</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-center">{stats.buses}</p>
          </CardContent>
        </Card>
        <Card className="w-[160px]">
          <CardHeader>
            <CardTitle className="text-center">Маршрутов</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-center">{stats.routes}</p>
          </CardContent>
        </Card>
        <Card className="w-[160px]">
          <CardHeader>
            <CardTitle className="text-center">Поездок</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-center">
              {stats.journeys}
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold mt-8">Статистика поездок по дням</h2>

      <div className="mb-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent>
            {monthOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ChartContainer
        config={chartConfig}
        className="min-h-[200px] w-full mt-6"
      >
        <BarChart data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            angle={-90}
            textAnchor="end"
            dy={-10}
            height={80}
          />
          <YAxis
            dataKey="journeys"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => (Number.isInteger(value) ? value : "")}
          />
          <Bar dataKey="journeys" fill="#2563eb" radius={5} />
        </BarChart>
      </ChartContainer>
    </div>
  )
}

/*
// Refresh session when component mounts:

const { data: user, isPending, refresh } = authClient.useSession();

useEffect(() => {
  refresh(); // Force a session refresh when the component mounts
}, [])
*/
