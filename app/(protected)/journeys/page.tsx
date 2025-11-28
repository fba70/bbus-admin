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

type JourneyTimeStampFilter = {
  startDate?: string
  endDate?: string
}

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

  const [pageSize, setPageSize] = React.useState(20) // Default items per page
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

  // console.log(Intl.DateTimeFormat().resolvedOptions().locale)
  // console.log("Journeys data:", journeys)

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
      filterFn: (row, columnId, filterValue) => {
        const journeyTimeStamp = new Date(row.getValue(columnId))
        const { startDate, endDate } = filterValue || {}

        // Parse and normalize startDate
        const startDateTime = startDate ? new Date(startDate) : null
        if (startDateTime) {
          startDateTime.setHours(0, 0, 0, 0) // Set time to 00:00:00
        }

        // Parse and normalize endDate
        const endDateTime = endDate ? new Date(endDate) : null
        if (endDateTime) {
          endDateTime.setHours(23, 59, 59, 999) // Set time to 23:59:59
        }

        // Check if journeyTimeStamp falls within the range
        if (startDateTime && journeyTimeStamp < startDateTime) {
          return false
        }
        if (endDateTime && journeyTimeStamp > endDateTime) {
          return false
        }

        return true
      },
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
        <div className="capitalize truncate max-w-[200px]">
          {row.original.accessCard.cardId}
        </div>
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
          {row.original.route?.organization?.name || "N/A"}
        </div>
      ),
      filterFn: (row, columnId, filterValue) => {
        const organizationName = row.original.route?.organization?.name || ""
        const collator = new Intl.Collator("ru", { sensitivity: "base" }) // Adjust locale as needed
        return (
          collator.compare(
            organizationName.toLowerCase(),
            filterValue.toLowerCase()
          ) === 0 ||
          organizationName.toLowerCase().includes(filterValue.toLowerCase())
        )
      },
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
      </div>
      <div className="w-[95%] flex flex-row items-center justify-between ">
        <div className="flex flex-row items-center gap-2">
          <Input
            type="date"
            placeholder="Start Date"
            value={
              (
                table.getColumn("journeyTimeStamp")?.getFilterValue() as {
                  startDate?: string
                  endDate?: string
                }
              )?.startDate || ""
            }
            onChange={(event) => {
              const newStartDate = event.target.value
              table
                .getColumn("journeyTimeStamp")
                ?.setFilterValue(
                  (prev: JourneyTimeStampFilter | undefined) => ({
                    ...(prev || {}),
                    startDate: newStartDate,
                  })
                )
            }}
          />
          <Input
            type="date"
            placeholder="End Date"
            value={
              (
                table.getColumn("journeyTimeStamp")?.getFilterValue() as {
                  startDate?: string
                  endDate?: string
                }
              )?.endDate || ""
            }
            onChange={(event) => {
              const newEndDate = event.target.value
              table
                .getColumn("journeyTimeStamp")
                ?.setFilterValue(
                  (prev: JourneyTimeStampFilter | undefined) => ({
                    ...(prev || {}),
                    endDate: newEndDate,
                  })
                )
            }}
          />
          <Button
            variant="outline"
            onClick={() => {
              table.getColumn("journeyTimeStamp")?.setFilterValue(undefined)
            }}
          >
            Сбросить фильтр
          </Button>
        </div>

        <Button
          variant="default"
          onClick={() => {
            if (journeys && journeys.length > 0) {
              const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(journeys, null, 2)
              )}`
              const downloadAnchorNode = document.createElement("a")
              downloadAnchorNode.setAttribute("href", dataStr)
              downloadAnchorNode.setAttribute("download", "journeys.json")
              document.body.appendChild(downloadAnchorNode)
              downloadAnchorNode.click()
              downloadAnchorNode.remove()
            } else {
              toast.error("No journeys data available to export.")
            }
          }}
        >
          Выгрузить поездки в JSON
        </Button>
      </div>

      <div className="w-[95%] overflow-hidden rounded-md border mt-4">
        <div className="max-h-[75vh] overflow-y-auto">
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
              {[20, 50, 100].map((size) => (
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

/*
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
*/
