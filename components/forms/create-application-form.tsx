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
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"
import { User } from "@/db/schema"
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

const formSchema = z.object({
  deviceId: z.string().min(6).max(20),
  appDescription: z.string(),
  userId: z.string().min(2).max(50),
})

export function CreateApplicationForm({
  organizationId,
  sessionUserId,
  onSuccess,
}: {
  organizationId: string
  sessionUserId: string
  onSuccess: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await axios.get(`${baseUrl}/api/users`, {
          params: { organizationId },
        })
        setUsers(response.data)
      } catch (error) {
        console.error("Failed to fetch users", error)
        toast.error("Failed to load users")
      }
    }
    fetchUsers()
  }, [baseUrl])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      deviceId: "",
      appDescription: "",
      userId: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      const payload = {
        sessionUserId: sessionUserId,
        ...values,
      }

      const response = await axios.post(
        `${baseUrl}/api/applications`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      )

      const newApplication = response.data
      console.log("Application created successfully:", newApplication)
      onSuccess()
      toast.success("Приложение успешно создано")
    } catch (error) {
      console.error(error)
      toast.error("Ошибка при создании приложения")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Добавить приложение</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать новое приложение</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="deviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Номер устройства (IMEI)</FormLabel>
                  <FormControl>
                    <Input placeholder="..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="appDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание приложения</FormLabel>
                  <FormControl>
                    <Input placeholder="..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Водитель</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите водителя" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name}
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
                "Создать приложение"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
