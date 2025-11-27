"use client"

import React, { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"
import { TimeSlot, Bus } from "@/db/schema"
import { SquarePen } from "lucide-react"
import axios from "axios"

const formSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  routeId: z.string().min(1, "Route ID is required"),
  route1cId: z.string().min(1, "Route 1C ID is required"),
  startTimestamp: z.string().min(1, "Start timestamp is required"),
  endTimestamp: z.string().min(1, "End timestamp is required"),
  busId: z.string().min(1, "Bus ID is required"),
})

interface EditTimeSlotFormProps {
  timeSlot: TimeSlot
  onUpdated?: () => void
  userId: string
}

export const EditTimeSlotForm: React.FC<EditTimeSlotFormProps> = ({
  timeSlot,
  onUpdated,
  userId,
}) => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [popoverOpen, setPopoverOpen] = useState(false)

  const [buses, setBuses] = useState<Bus[]>([])
  const [selectedBus, setSelectedBus] = useState<Bus | null>(
    buses.find((bus) => bus.id === timeSlot.busId) || null
  )

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  const fetchBuses = async () => {
    if (!userId) {
      console.error("User not authenticated")
      return
    }

    try {
      const response = await axios.get(`${baseUrl}/api/buses?userId=${userId}`)
      setBuses(response.data)
      // Set selectedBus based on timeSlot.busId if needed
      const initialBus = response.data.find(
        (bus: Bus) => bus.id === timeSlot.busId
      )
      setSelectedBus(initialBus || null)
    } catch (error) {
      console.error("Error fetching buses:", error)
    }
  }

  useEffect(() => {
    fetchBuses()
  }, [timeSlot.busId])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderId: timeSlot.orderId || "",
      routeId: timeSlot.routeId || "",
      route1cId: timeSlot.route1cId || "",
      startTimestamp: timeSlot.startTimestamp
        ? new Date(timeSlot.startTimestamp).toISOString().slice(0, 16)
        : "",
      endTimestamp: timeSlot.endTimestamp
        ? new Date(timeSlot.endTimestamp).toISOString().slice(0, 16)
        : "",
      busId: timeSlot.busId || "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true)
    try {
      const timeSlotData = {
        ...values,
        startTimestamp: new Date(values.startTimestamp),
        endTimestamp: new Date(values.endTimestamp),
      }

      await axios.patch(`${baseUrl}/api/sources/orders`, { timeSlotData })
      toast.success("Заказ успешно обновлен")
      setOpen(false)
      onUpdated?.()
    } catch (error) {
      toast.error("Не удалось обновить заказ")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <SquarePen />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать заказ</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="orderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID заказа</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel>ID маршрута</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="route1cId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID маршрута 1C</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startTimestamp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Время начала</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTimestamp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Время окончания</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="busId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>ID автобуса</FormLabel>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between"
                        >
                          {selectedBus
                            ? selectedBus.busPlateNumber
                            : "Выберите автобус..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Поиск автобуса..." />
                        <CommandList>
                          <CommandEmpty>Автобус не найден.</CommandEmpty>
                          <CommandGroup>
                            {buses.map((bus) => (
                              <CommandItem
                                key={bus.id}
                                value={bus.busPlateNumber}
                                onSelect={() => {
                                  setSelectedBus(bus)
                                  field.onChange(bus.id)
                                  setOpen(false)
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedBus?.id === bus.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {bus.busPlateNumber}
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

            <DialogFooter>
              <Button onClick={() => setOpen(false)} variant="outline">
                Отменить
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Обновление..." : "Обновить заказ"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
