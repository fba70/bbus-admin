"use client"

import * as React from "react"
import { useState } from "react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
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
import { Journey } from "@/db/schema"
import { toast } from "sonner"
import axios from "axios"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const formSchema = z.object({
  carStateNumber: z.string().optional(),
  counterpartyInn: z.string().optional(),
  routeUid: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export default function Reports() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const [journeys, setJourneys] = useState<Journey[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
  const apiKey = process.env.NEXT_PUBLIC_BBUS_API_KEY || ""

  const { data: user, isPending } = authClient.useSession()

  function formatDate(dateStr: string): string {
    if (!dateStr) return ""
    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${day}.${month}.${year}` // Removed time components
  }

  if (!user && !isPending) {
    unauthorized()
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true)
      setError(null)

      const journeyParams = {
        carStateNumber: values.carStateNumber ? [values.carStateNumber] : [],
        routeUid: values.routeUid ? [values.routeUid] : [],
        counterpartyInn: values.counterpartyInn || "",
        startDate: formatDate(values.startDate || ""),
        endDate: formatDate(values.endDate || ""),
      }

      const payload = {
        apiKey,
        journeyParams,
      }

      console.log("Submitting with params:", payload)

      const response = await axios.get(`${baseUrl}/api/sources/journeys`, {
        params: {
          data: JSON.stringify(payload),
        },
      })

      const data: Journey[] = response.data
      setJourneys(data)
      toast.success("Journeys fetched successfully.")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      )
      toast.error(`Error fetching journeys: ${error}`)
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
          Time Stamp
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">
          {new Intl.DateTimeFormat("en-CA").format(
            new Date(row.getValue("journeyTimeStamp"))
          )}
        </div>
      ),
    },
    {
      accessorKey: "coordinatesLattitude",
      header: "Latitude",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("coordinatesLattitude")}</div>
      ),
    },
    {
      accessorKey: "coordinatesLongitude",
      header: "Longitude",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("coordinatesLongitude")}</div>
      ),
    },
    {
      accessorKey: "journeyStatus",
      header: "Status",
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("journeyStatus")}</div>
      ),
    },
    {
      accessorKey: "bus",
      header: "Bus",
      cell: ({ row }) => (
        <div className="capitalize">{row.original.bus?.busPlateNumber}</div>
      ),
    },
    {
      accessorKey: "route",
      header: "Route",
      cell: ({ row }) => (
        <div className="capitalize">{row.original.route?.routeName}</div>
      ),
    },
    {
      accessorKey: "accessCard",
      header: "Access Card",
      cell: ({ row }) => (
        <div className="capitalize">{row.original.accessCard?.cardId}</div>
      ),
    },
  ]

  const table = useReactTable({
    data: journeys || [],
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters: [],
      columnVisibility,
      rowSelection,
    },
  })

  if (loading) {
    return <Loading />
  }

  return (
    <div className="flex flex-col gap-2 items-center justify-start h-screen">
      <h1 className="text-2xl font-bold my-4">Отчеты по поездкам</h1>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-[95%] space-y-4"
      >
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="carStateNumber">Car State Number</Label>
            <Input
              id="carStateNumber"
              {...form.register("carStateNumber")}
              placeholder="A123BC"
            />
          </div>
          <div>
            <Label htmlFor="counterpartyInn">Counterparty INN</Label>
            <Input
              id="counterpartyInn"
              {...form.register("counterpartyInn")}
              placeholder="1234567890"
            />
          </div>
          <div>
            <Label htmlFor="routeUid">Route UID</Label>
            <Input
              id="routeUid"
              {...form.register("routeUid")}
              placeholder="route-123"
            />
          </div>
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date" // Changed from "datetime-local"
              {...form.register("startDate")}
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date" // Changed from "datetime-local"
              {...form.register("endDate")}
            />
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Генерация отчета..." : "Сформировать отчет"}
        </Button>
      </form>

      {journeys && journeys.length > 0 && (
        <>
          <div className="w-[95%] flex justify-end py-4">
            <Button
              variant="default"
              onClick={() => {
                const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
                  JSON.stringify(journeys, null, 2)
                )}`
                const downloadAnchorNode = document.createElement("a")
                downloadAnchorNode.setAttribute("href", dataStr)
                downloadAnchorNode.setAttribute(
                  "download",
                  "journeys-report.json"
                )
                document.body.appendChild(downloadAnchorNode)
                downloadAnchorNode.click()
                downloadAnchorNode.remove()
              }}
            >
              Export Journeys as JSON
            </Button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
