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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { authClient } from "@/lib/auth-client"
import { unauthorized } from "next/navigation"
import Loading from "@/app/loading"
import { Route } from "@/db/schema"
import { toast } from "sonner"
import axios from "axios"
import { CreateRouteForm } from "@/components/forms/create-route-form"
import { EditRouteForm } from "@/components/forms/edit-route-form"

export default function Routes() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const [routes, setRoutes] = useState<Route[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [pageSize, setPageSize] = React.useState(10) // Default items per page
  const [pageIndex, setPageIndex] = React.useState(0) // Default page index

  const [showFileUploadDialog, setShowFileUploadDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const { data: user, isPending } = authClient.useSession()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  if (!user && !isPending) {
    unauthorized()
  }

  useEffect(() => {
    fetchRoutes()
  }, [user])

  async function fetchRoutes() {
    try {
      setLoading(true)
      setError(null)

      if (!user || !user.user.id) {
        throw new Error("User is not authenticated.")
      }

      const response = await axios.get(`${baseUrl}/api/routes`, {
        params: { userId: user.user.id },
      })

      const data: Route[] = response.data
      setRoutes(data)
      toast.success("Routes fetched successfully.")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      )
      toast.error(`Error fetching routes data: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  // console.log("Routes data:", routes)

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
          !parsedData.RoutesDictionary ||
          !Array.isArray(parsedData.RoutesDictionary) ||
          !parsedData.RoutesDictionary.every(
            (item: any) =>
              typeof item.routeUid1c === "string" &&
              typeof item.counterpartyInn === "string" &&
              typeof item.routeUid === "string"
          )
        ) {
          throw new Error(
            "Invalid JSON structure. Expected 'RoutesDictionary' array with objects containing 'routeUid1c', 'counterpartyInn', and 'routeUid' as strings."
          )
        }

        // Add the apiKey parameter and rename the key
        const finalData = {
          apiKey: process.env.NEXT_PUBLIC_BBUS_API_KEY,
          RoutesDictionary: parsedData.RoutesDictionary, // Rename the key here
        }

        // console.log("Final buses object ready for processing:", finalData)

        // Update data with the API
        try {
          const response = await axios.post(
            `${baseUrl}/api/sources/routes`,
            finalData
          )
          console.log("API response:", response.data)
          toast.success("Справочник маршрутов обновлен.")

          fetchRoutes() // Refresh the routes data
        } catch (error) {
          console.error(
            "Error uploading routes data:",
            error instanceof Error ? error.message : String(error)
          )
          toast.error("Не удалось обновить справочник маршрутов.")
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

  const columns: ColumnDef<Route>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="hidden">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "routeId",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Номер маршрута
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("routeId")}</div>
      ),
    },
    {
      accessorKey: "routeName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Название маршрута
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("routeName")}</div>
      ),
    },
    {
      accessorKey: "organization",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Организация
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">
          {row.original.organization?.name || "N/A"}
        </div>
      ),
      filterFn: (row, columnId, filterValue) => {
        const organizationName = row.original.organization?.name || ""
        return organizationName
          .toLowerCase()
          .includes(filterValue.toLowerCase())
      },
    },
    {
      accessorKey: "routeMode",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Режим маршрута
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("routeMode")}</div>
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
          <EditRouteForm
            route={row.original}
            userId={user.user.id}
            onSuccess={fetchRoutes} // Pass the callback
          />
        )
      },
    },
  ]

  /*
 {
      accessorKey: "routeDescription",
      header: "Описание маршрута",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("routeDescription")}</div>
      ),
    },
  */

  const table = useReactTable({
    data: routes || [],
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
      <h1 className="text-2xl font-bold my-4">Маршруты</h1>

      <div className="w-[95%] flex flex-row items-center gap-6 py-4">
        <Input
          placeholder="Фильтр ID маршрутов..."
          value={(table.getColumn("routeId")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("routeId")?.setFilterValue(event.target.value)
          }
          className=""
        />
        <Input
          placeholder="Фильтр названий маршрутов..."
          value={
            (table.getColumn("routeName")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("routeName")?.setFilterValue(event.target.value)
          }
          className=""
        />
        <Input
          placeholder="Фильтр режимов маршрутов..."
          value={
            (table.getColumn("routeMode")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("routeMode")?.setFilterValue(event.target.value)
          }
          className=""
        />
        <Input
          placeholder="Фильтр по организации..."
          value={
            (table.getColumn("organization")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("organization")?.setFilterValue(event.target.value)
          }
          className=""
        />
        {user?.user.id && user.session.activeOrganizationId && (
          <>
            <CreateRouteForm
              userId={user.user.id}
              organizationId={user.session.activeOrganizationId}
              onSuccess={fetchRoutes} // Pass the callback
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
                  Загрузите файл с данными по маршрутам в формате JSON или CSV
                  согласованной структуры:
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
    </div>
  )
}
