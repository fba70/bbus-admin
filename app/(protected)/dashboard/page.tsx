"use client"

import React, { useEffect, useState } from "react"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { Journey } from "@/db/schema"
import { unauthorized } from "next/navigation"
import Loading from "@/app/loading"

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
  const [loading, setLoading] = useState(true)

  const [stats, setStats] = useState({
    accessCards: 0,
    applications: 0,
    buses: 0,
    routes: 0,
    journeys: 0,
  })

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
      const [
        accessCardsRes,
        applicationsRes,
        busesRes,
        routesRes,
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
        axios.get(`${baseUrl}/api/applications`, {
          params: { userId: user.user.id },
        }),
        axios.get(`${baseUrl}/api/journeys`, {
          params: { sessionUserId: user.user.id },
        }),
      ])

      // Update state with total counts
      setStats({
        accessCards: accessCardsRes.data.length,
        applications: applicationsRes.data.length,
        buses: busesRes.data.length,
        routes: routesRes.data.length,
        journeys: journeysRes.data.length,
      })

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

  function prepareChartData(journeys: Journey[]) {
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
        <Card className="w-[190px]">
          <CardHeader>
            <CardTitle className="text-center">Карт доступа</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-center">
              {stats.accessCards}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Приложений</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-center">
              {stats.applications}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Автобусов</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-center">{stats.buses}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Маршрутов</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold text-center">{stats.routes}</p>
          </CardContent>
        </Card>
        <Card>
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
