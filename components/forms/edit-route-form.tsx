"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
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
import { useState } from "react"
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
import { Route } from "@/db/schema"

const routeModeSchema = z.enum(["REGISTRATION", "AUTHORIZATION"])

const formSchema = z.object({
  routeId: z.string().min(2).max(50),
  routeName: z.string().min(2).max(50),
  routeDescription: z.string().min(2).max(1000),
  routeMode: routeModeSchema,
})

export function EditRouteForm({
  userId,
  route,
  onSuccess,
}: {
  userId: string
  route: Route
  onSuccess: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      routeId: route.routeId,
      routeName: route.routeName,
      routeDescription: route.routeDescription || "",
      routeMode: route.routeMode || "REGISTRATION",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      const payload = {
        userId,
        id: route.id,
        ...values,
      }

      const response = await axios.patch(`${baseUrl}/api/routes`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      const newRoute = response.data
      console.log("Route edited successfully:", newRoute)
      onSuccess()
      toast.success("Маршрут успешно изменен")
    } catch (error) {
      console.error(error)
      toast.error("Ошибка при изменении маршрута")
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
          <DialogTitle>Редактировать маршрут</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="routeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Номер маршрута</FormLabel>
                  <FormControl>
                    <Input placeholder="..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="routeName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название маршрута</FormLabel>
                  <FormControl>
                    <Input placeholder="..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="routeDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание маршрута</FormLabel>
                  <FormControl>
                    <Input placeholder="..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="routeMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Режим маршрута</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите режим" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="REGISTRATION">
                          Регистрация
                        </SelectItem>
                        <SelectItem value="AUTHORIZATION">
                          Авторизация
                        </SelectItem>
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
                "Изменить маршрут"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
