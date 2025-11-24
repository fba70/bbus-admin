"use client"

import * as React from "react"
import { useEffect, useState } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { authClient } from "@/lib/auth-client"
import { unauthorized } from "next/navigation"
import Loading from "@/app/loading"
import { Bus, Route } from "@/db/schema"
import { toast } from "sonner"
import axios from "axios"
import { CreateBusForm } from "@/components/forms/create-bus-form"
import { EditBusForm } from "@/components/forms/edit-bus-form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function Buses() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const [buses, setBuses] = useState<Bus[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [pageSize, setPageSize] = React.useState(10) // Default items per page
  const [pageIndex, setPageIndex] = React.useState(0) // Default page index

  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const [selectedTimeSlots, setSelectedTimeSlots] = useState<
    Bus["timeSlots"] | null
  >(null)
  const [showTimeSlotsDialog, setShowTimeSlotsDialog] = useState(false)

  const { data: user, isPending } = authClient.useSession()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  if (!user && !isPending) {
    unauthorized()
  }

  useEffect(() => {
    fetchBuses()
  }, [user])

  async function fetchBuses() {
    try {
      setLoading(true)
      setError(null)

      if (!user || !user.user.id) {
        throw new Error("User is not authenticated.")
      }

      const response = await axios.get(`${baseUrl}/api/buses`, {
        params: { userId: user.user.id },
      })

      const data: Bus[] = response.data
      setBuses(data)
      toast.success("Список автобусов загружен")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      )
      toast.error(`Ошибка при загрузке данных автобусов: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // console.log("Buses data:", buses)

  async function handleFileUpload(file: File | null) {
    if (!file) {
      console.log("No file selected.")
      return
    }

    const fileName = file.name.toLowerCase()

    if (fileName.endsWith(".json")) {
      try {
        // Read the file content
        const fileContent = await file.text()
        const parsedData = JSON.parse(fileContent)

        // Validate the structure
        if (
          !parsedData.StateNumber ||
          !Array.isArray(parsedData.StateNumber) ||
          !parsedData.StateNumber.every(
            (item: any) => typeof item.StateNumber === "string"
          )
        ) {
          throw new Error(
            "Invalid JSON structure. Expected 'StateNumber' array."
          )
        }

        // Add the apiKey parameter and rename the key
        const finalData = {
          apiKey: process.env.NEXT_PUBLIC_BBUS_API_KEY,
          StateNumbersDictionary: parsedData.StateNumber, // Rename the key here
        }

        // console.log("Final buses object ready for processing:", finalData)

        // Update data with the API
        try {
          const response = await axios.post(
            `${baseUrl}/api/sources/buses`,
            finalData
          )
          console.log("API response:", response.data)
          toast.success("Справочник автобусов обновлен.")

          fetchBuses() // Refresh the buses data
        } catch (error) {
          console.error(
            "Error uploading buses data:",
            error instanceof Error ? error.message : String(error)
          )
          toast.error("Не удалось обновить справочник автобусов.")
        }
      } catch (error) {
        console.error(
          "Error processing JSON file:",
          error instanceof Error ? error.message : String(error)
        )
      }
    } else if (fileName.endsWith(".csv")) {
      console.log("CSV file processing is not implemented yet.")
      // Leave CSV processing empty for now
    } else {
      console.error(
        "Неподдерживаемый тип файла. Пожалуйста, загрузите JSON или CSV файл."
      )
    }
  }

  const columns: ColumnDef<Bus>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="hidden">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "busPlateNumber",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Номер автобуса
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("busPlateNumber")}</div>
      ),
    },
    {
      accessorKey: "busDescription",
      header: "Описание автобуса",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("busDescription")}</div>
      ),
    },
    {
      id: "route.routeId",
      accessorFn: (row) => row.route.routeId,
      header: "ID текущего маршрута",
      cell: ({ row }) => (
        <div className="capitalize">{row.original.route.routeId}</div>
      ),
    },
    {
      id: "timeSlots",
      header: "Маршруты",
      cell: ({ row }) => (
        <Button
          variant="link"
          onClick={() => {
            setSelectedTimeSlots(row.original.timeSlots) // Set the selected timeSlots
            setShowTimeSlotsDialog(true) // Open the modal
          }}
        >
          Маршруты
        </Button>
      ),
    },
    {
      id: "route.routeName",
      accessorFn: (row) => row.route.routeName,
      header: "Название текущего маршрута",
      cell: ({ row }) => (
        <div className="capitalize">{row.original.route.routeName}</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Создано
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">
          {new Intl.DateTimeFormat("en-CA").format(
            new Date(row.getValue("createdAt"))
          )}
        </div>
      ),
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Обновлено
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">
          {new Intl.DateTimeFormat("en-CA").format(
            new Date(row.getValue("createdAt"))
          )}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        if (!user || !user.user.id) {
          return null
        }
        return (
          <EditBusForm
            bus={row.original}
            userId={user.user.id}
            onSuccess={fetchBuses} // Pass the callback
          />
        )
      },
    },
  ]

  const table = useReactTable({
    data: buses || [],
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageSize, // Use the pageSize state
        pageIndex, // Use the pageIndex state
      },
    },
  })

  if (loading) {
    return <Loading />
  }

  return (
    <div className="flex flex-col gap-2 items-center justify-start h-screen">
      <h1 className="text-2xl font-bold my-4">Автобусы</h1>

      <div className="w-[95%] flex flex-row items-center gap-6 py-4">
        <Input
          placeholder="Фильтр номеру автобуса..."
          value={
            (table.getColumn("busPlateNumber")?.getFilterValue() as string) ??
            ""
          }
          onChange={(event) =>
            table
              .getColumn("busPlateNumber")
              ?.setFilterValue(event.target.value)
          }
          className=""
        />
        <Input
          placeholder="Фильтр по маршруту"
          value={
            (table.getColumn("route.routeName")?.getFilterValue() as string) ??
            ""
          }
          onChange={(event) =>
            table
              .getColumn("route.routeName")
              ?.setFilterValue(event.target.value)
          }
          className=""
        />

        {user?.user.id && user.session.activeOrganizationId && (
          <>
            <CreateBusForm
              userId={user.user.id}
              organizationId={user.session.activeOrganizationId}
              onSuccess={fetchBuses} // Pass the callback
            />

            <Dialog
              open={showFileUploadDialog}
              onOpenChange={setShowFileUploadDialog}
            >
              <DialogTrigger asChild>
                <Button
                  variant="default"
                  onClick={() => setShowFileUploadDialog(true)} // Open the file upload dialog
                >
                  Обновить справочник
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Обновить справочник из файла</DialogTitle>
                </DialogHeader>
                <Label
                  htmlFor="fileUpload"
                  className="text-sm text-muted-foreground"
                >
                  Загрузите файл с данными по номерам автобусов в формате JSON
                  или CSV согласованной структуры:
                </Label>
                <Input
                  id="fileUpload"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} // Store the selected file
                  className="mt-2"
                />
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setShowFileUploadDialog(false)} // Close the dialog
                  >
                    Отменить
                  </Button>
                  <Button
                    variant="default"
                    onClick={() => {
                      if (selectedFile) {
                        handleFileUpload(selectedFile) // Process the file on button click
                      } else {
                        toast.error("Please select a file before uploading.")
                      }
                      setShowFileUploadDialog(false) // Close the dialog
                    }}
                  >
                    Загрузить
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>

      <div className="w-[95%] overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-muted-foreground flex-1 text-sm">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex flex-row items-center justify-center gap-8 space-x-2">
          <div className="flex flex-row items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPageIndex((prev) => Math.max(prev - 1, 0)) // Decrease pageIndex
                table.previousPage() // Trigger table's previous page logic
              }}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPageIndex((prev) => prev + 1) // Increase pageIndex
                table.nextPage() // Trigger table's next page logic
              }}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="pageSize" className="text-sm font-medium">
              Строк на странице:
            </label>
            <select
              id="pageSize"
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              {[2, 5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Dialog open={showTimeSlotsDialog} onOpenChange={setShowTimeSlotsDialog}>
        <DialogContent className="max-h-[500px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Список маршрутов за последние 2 дня:</DialogTitle>
          </DialogHeader>
          {selectedTimeSlots && selectedTimeSlots.length > 0 ? (
            <div className="flex flex-col gap-4">
              {selectedTimeSlots
                .filter((slot) => {
                  const now = new Date()
                  const twoDaysAgo = new Date(
                    now.getTime() - 2 * 24 * 60 * 60 * 1000
                  )
                  const start = new Date(slot.startTimestamp)
                  const end = new Date(slot.endTimestamp)

                  return start >= twoDaysAgo || end >= twoDaysAgo
                })
                .map((slot) => (
                  <div
                    key={slot.id}
                    className="border rounded p-4 flex flex-col gap-2"
                  >
                    <p>
                      <span className="text-sm text-gray-500">
                        ID маршрута:
                      </span>{" "}
                      <span className="text-sm">{slot.routeId}</span>
                    </p>
                    <p>
                      <span className="text-sm text-gray-500">
                        ID маршрута 1С:
                      </span>{" "}
                      <span className="text-sm">{slot.route1cId}</span>
                    </p>
                    <p>
                      <span className="text-sm text-gray-500">Начало:</span>{" "}
                      <span className="text-sm">
                        {new Intl.DateTimeFormat("ru-RU", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(slot.startTimestamp))}
                      </span>
                    </p>
                    <p>
                      <span className="text-sm text-gray-500">Конец:</span>{" "}
                      <span className="text-sm">
                        {new Intl.DateTimeFormat("ru-RU", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(slot.endTimestamp))}
                      </span>
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <p>Маршрутов за последние 2 дня не найдено</p>
          )}
          <DialogFooter>
            <Button
              variant="default"
              onClick={() => setShowTimeSlotsDialog(false)}
            >
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
