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
import { Journey } from "@/db/schema"
import { toast } from "sonner"
import axios from "axios"
// import { CreateJourneyForm } from "@/components/forms/create-journey-form"

export default function Journeys() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const [journeys, setJourneys] = useState<Journey[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [pageSize, setPageSize] = React.useState(10) // Default items per page
  const [pageIndex, setPageIndex] = React.useState(0) // Default page index

  const { data: user, isPending } = authClient.useSession()

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  if (!user && !isPending) {
    unauthorized()
  }

  useEffect(() => {
    fetchJourneys()
  }, [user])

  async function fetchJourneys() {
    try {
      setLoading(true)
      setError(null)

      if (!user || !user.user.id) {
        throw new Error("User is not authenticated.")
      }

      const response = await axios.get(`${baseUrl}/api/journeys`, {
        params: { sessionUserId: user.user.id },
      })

      const data: Journey[] = response.data
      setJourneys(data)
      toast.success("Journeys fetched successfully.")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      )
      toast.error(`Error fetching journeys data: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const columns: ColumnDef<Journey>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="hidden">{row.getValue("id")}</div>,
    },
    {
      accessorKey: "journeyTimeStamp",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Время поездки
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">
          {new Intl.DateTimeFormat("en-CA", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          }).format(new Date(row.getValue("journeyTimeStamp")))}
        </div>
      ),
    },
    {
      accessorKey: "journeyStatus",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Статус поездки
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("journeyStatus")}</div>
      ),
    },
    {
      accessorKey: "coordinatesLattitude",
      header: "Широта",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("coordinatesLattitude")}</div>
      ),
    },
    {
      accessorKey: "coordinatesLongitude",
      header: "Долгота",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("coordinatesLongitude")}</div>
      ),
    },
    {
      id: "journey.accessCard.cardId",
      accessorFn: (row) => row.accessCard.cardId,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Номер карты
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.original.accessCard.cardId}</div>
      ),
    },
    {
      id: "journey.bus.busPlateNNumber",
      accessorFn: (row) => row.bus.busPlateNumber,
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
        <div className="capitalize">{row.original.bus.busPlateNumber}</div>
      ),
    },
    {
      id: "journey.route.routeName",
      accessorFn: (row) => row.route.routeName,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Маршрут
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.original.route.routeName}</div>
      ),
    },
    {
      id: "journey.application.deviceId",
      accessorFn: (row) => row.application.deviceId,
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          ID устройства
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.original.application.deviceId}</div>
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
  ]

  /*
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        if (!user || !user.user.id) {
          return null
        }
        return (
          <EditJourneyForm
            journey={row.original}
            userId={user.user.id}
            onSuccess={fetchJourneys} // Pass the callback
          />
        )
      },
    },
  */

  const table = useReactTable({
    data: journeys || [],
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

  /*
        {user?.user.id && user.session.activeOrganizationId && (
          <CreateJourneyForm
            userId={user.user.id}
            organizationId={user.session.activeOrganizationId}
            onSuccess={fetchJourneys} // Pass the callback
          />
        )}
  */

  return (
    <div className="flex flex-col gap-2 items-center justify-start h-screen">
      <h1 className="text-2xl font-bold my-4">Поездки</h1>

      <div className="w-[95%] flex flex-row items-center gap-6 py-4">
        <Input
          placeholder="Фильтр по статусу поездок..."
          value={
            (table.getColumn("journeyStatus")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("journeyStatus")?.setFilterValue(event.target.value)
          }
          className=""
        />
        <Input
          placeholder="Фильтр по номеру автобуса..."
          value={
            (table
              .getColumn("journey.bus.busPlateNNumber")
              ?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table
              .getColumn("journey.bus.busPlateNNumber")
              ?.setFilterValue(event.target.value)
          }
          className=""
        />
        <Input
          placeholder="Фильтр по маршруту..."
          value={
            (table
              .getColumn("journey.route.routeName")
              ?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table
              .getColumn("journey.route.routeName")
              ?.setFilterValue(event.target.value)
          }
          className=""
        />
        <Input
          placeholder="Фильтр по номеру карты..."
          value={
            (table
              .getColumn("journey.accessCard.cardId")
              ?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table
              .getColumn("journey.accessCard.cardId")
              ?.setFilterValue(event.target.value)
          }
          className=""
        />
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
