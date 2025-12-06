"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useState, useEffect } from "react"
import { Loader2, SquarePen } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import axios from "axios"
import { Bus, Route } from "@/db/schema"

const formSchema = z.object({
  busPlateNumber: z.string().min(6).max(10),
  busDescription: z.string().min(2).max(1000),
  routeId: z.string().min(2).max(50),
})

export function EditBusForm({
  userId,
  bus,
  onSuccess,
}: {
  userId: string
  bus: Bus
  onSuccess: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [routes, setRoutes] = useState<Route[]>([])

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  useEffect(() => {
    async function fetchRoutes() {
      try {
        const response = await axios.get(`${baseUrl}/api/routes`, {
          params: { userId },
        })
        setRoutes(response.data)
      } catch (error) {
        console.error("Failed to fetch routes", error)
        toast.error("Failed to load routes")
      }
    }
    fetchRoutes()
  }, [userId, baseUrl])

  console.log("Available routes:", routes)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      busPlateNumber: bus.busPlateNumber,
      busDescription: bus.busDescription || "",
      routeId: bus.route.id,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      const payload = {
        userId,
        id: bus.id,
        ...values,
      }

      const response = await axios.patch(`${baseUrl}/api/buses`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      const newBus = response.data
      console.log("Bus edited successfully:", newBus)
      onSuccess()
      toast.success("Данные автобуса успешно изменены")
    } catch (error) {
      console.error(error)
      toast.error("Ошибка при изменении данных автобуса")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <SquarePen className="" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать автобус</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="busPlateNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Номер автобуса</FormLabel>
                  <FormControl>
                    <Input placeholder="..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="busDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание автобуса</FormLabel>
                  <FormControl>
                    <Input placeholder="..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="routeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Маршрут автобуса</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={routes.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите маршрут" />
                      </SelectTrigger>
                      <SelectContent>
                        {routes.map((route) => (
                          <SelectItem key={route.id} value={route.id}>
                            {route.routeName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              disabled={isLoading}
              type="submit"
              className="mx-auto block"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Изменить автобус"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
