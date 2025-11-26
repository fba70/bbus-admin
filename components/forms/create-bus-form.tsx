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
import { Bus, Route } from "@/db/schema"
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import axios from "axios"

const formSchema = z.object({
  busPlateNumber: z.string().min(6).max(10),
  busDescription: z.string().min(2).max(1000),
  routeId: z.string().min(2).max(50),
})

export function CreateBusForm({
  userId,
  organizationId,
  onSuccess,
}: {
  userId: string
  organizationId: string
  onSuccess: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [routes, setRoutes] = useState<Route[]>([])

  const [open, setOpen] = useState(false)

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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      busPlateNumber: "",
      busDescription: "",
      routeId: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      const payload = {
        userId,
        organizationId,
        ...values,
      }

      const response = await axios.post(`${baseUrl}/api/buses`, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      const newBus = response.data
      console.log("Bus created successfully:", newBus)
      onSuccess()
      toast.success("Автобус успешно создан")
    } catch (error) {
      console.error(error)
      toast.error("Ошибка при создании автобуса")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Добавить автобус</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать новый автобус</DialogTitle>
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
                <FormItem className="flex flex-col">
                  <FormLabel>Маршрут автобуса</FormLabel>
                  <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between"
                        >
                          {field.value
                            ? routes.find((route) => route.id === field.value)
                                ?.routeName
                            : "Выберите маршрут"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Поиск маршрута..." />
                        <CommandList>
                          <CommandEmpty>Маршрут не найден.</CommandEmpty>
                          <CommandGroup>
                            {routes.map((route) => (
                              <CommandItem
                                key={route.id}
                                value={route.routeName}
                                onSelect={() => {
                                  field.onChange(route.id)
                                  setOpen(false)
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    field.value === route.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {route.routeName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                "Создать автобус"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/*
<FormField
              control={form.control}
              name="routeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Маршрут автобуса</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} value={field.value}>
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
*/
