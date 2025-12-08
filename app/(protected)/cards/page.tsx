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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { authClient } from "@/lib/auth-client"
import { unauthorized } from "next/navigation"
import Loading from "@/app/loading"
import { AccessCard, Organization } from "@/db/schema"
import { toast } from "sonner"
import axios from "axios"
import { EditCardForm } from "@/components/forms/edit-card-form"
import { Checkbox } from "@/components/ui/checkbox"
import { CreateCardForm } from "@/components/forms/create-card-form"

export default function AccessCards() {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [accessCards, setAccessCards] = useState<AccessCard[] | null>([])
  const [orgLoading, setOrgLoading] = useState(false)
  const [cardsLoading, setCardsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [selectedOrgId, setSelectedOrgId] = useState<string>("")

  const [pageSize, setPageSize] = React.useState(20) // Default items per page
  const [pageIndex, setPageIndex] = React.useState(0) // Default page index

  const orgFetchedRef = React.useRef(false)

  const { data: user, isPending } = authClient.useSession()
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"

  if (!user && !isPending) {
    unauthorized()
  }

  // 1. Fetch organizations once when user session becomes available
  useEffect(() => {
    if (!orgFetchedRef.current && user && !isPending) {
      orgFetchedRef.current = true
      fetchOrganizations()
    }
  }, [user, isPending])

  async function fetchOrganizations() {
    try {
      setOrgLoading(true)
      setError(null)
      if (!user || !user.user.id) throw new Error("User is not authenticated.")
      const response = await axios.get(`${baseUrl}/api/clients`, {
        params: { userId: user.user.id },
      })
      setOrganizations(response.data)
      toast.success("Organizations fetched successfully.")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      )
      toast.error(`Error fetching organizations data: ${error}`)
    } finally {
      setOrgLoading(false)
    }
  }

  // console.log("Available organizations:", organizations)

  // 3. Fetch cards only when organization is selected (button click)
  async function fetchCards() {
    try {
      setCardsLoading(true)
      setError(null)
      if (!user || !user.user.id || !selectedOrgId)
        throw new Error("User or organization is not selected.")
      const response = await axios.get(`${baseUrl}/api/access-cards`, {
        params: { userId: user.user.id, organizationId: selectedOrgId },
      })
      setAccessCards(response.data)
      toast.success("Access cards fetched successfully.")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      )
      toast.error(`Error fetching access cards data: ${error}`)
    } finally {
      setCardsLoading(false)
    }
  }

  const handleDeleteSelected = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.error("No rows selected for deletion.")
      return
    }

    const selectedIds = selectedRows.map((row) => row.original.id)

    try {
      if (!user || !user.user.id) {
        throw new Error("User is not authenticated.")
      }

      const response = await axios.delete(`${baseUrl}/api/access-cards`, {
        data: {
          userId: user.user.id,
          ids: selectedIds,
        },
      })

      const { deletedCount, notFoundIds } = response.data

      // Refetch cards to update the UI
      await fetchCards()

      // Reset selection
      setRowSelection({})

      toast.success(`Successfully deleted ${deletedCount} card(s).`)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred."
      )
      toast.error(`Error fetching access cards data: ${err}`)
    }
  }

  // 4. Use resulting cards list as data source for the table
  const columns: ColumnDef<AccessCard>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <div className="hidden">{row.getValue("id")}</div>,
    },
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "cardId",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Номер пропуска
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("cardId")}</div>
      ),
    },
    {
      accessorKey: "nameOnCard",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Имя на пропуске
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("nameOnCard")}</div>
      ),
    },
    {
      accessorKey: "cardType",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Тип пропуска
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("cardType")}</div>
      ),
    },
    {
      accessorKey: "cardStatus",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Статус пропуска
          <ArrowUpDown />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="capitalize">{row.getValue("cardStatus")}</div>
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
            new Date(row.getValue("updatedAt"))
          )}
        </div>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        if (!user || !user.user.id) return null
        return (
          <EditCardForm
            card={row.original}
            userId={user.user.id}
            onSuccess={fetchCards}
          />
        )
      },
    },
  ]

  const table = useReactTable({
    data: accessCards || [],
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

  // Show full page loading while session is pending or when cards are being fetched.
  // Don't block the whole page for organizations loading so the selector remains interactive.
  if (isPending || cardsLoading) {
    return <Loading />
  }

  return (
    <div className="flex flex-col gap-2 items-center justify-start h-screen">
      <h1 className="text-2xl font-bold my-4">Пропуска</h1>

      <div className="flex flex-row items-center gap-2 my-4">
        <Select
          value={selectedOrgId}
          onValueChange={setSelectedOrgId}
          disabled={organizations.length === 0}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Выберите организацию" />
          </SelectTrigger>
          <SelectContent>
            {organizations.length === 0 ? (
              <SelectItem value="no-orgs" disabled>
                Нет доступных организаций
              </SelectItem>
            ) : (
              organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <Button onClick={fetchCards} disabled={!selectedOrgId}>
          Загрузить пропуска организации
        </Button>
      </div>

      {accessCards && accessCards.length > 0 && (
        <>
          <div className="w-[95%] flex flex-row items-center gap-6 py-4">
            <Input
              placeholder="Фильтр ID пропусков..."
              value={
                (table.getColumn("cardId")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("cardId")?.setFilterValue(event.target.value)
              }
            />
            <Input
              placeholder="Фильтр по именам..."
              value={
                (table.getColumn("nameOnCard")?.getFilterValue() as string) ??
                ""
              }
              onChange={(event) =>
                table
                  .getColumn("nameOnCard")
                  ?.setFilterValue(event.target.value)
              }
            />
            <Input
              placeholder="Фильтр типам пропусков..."
              value={
                (table.getColumn("cardType")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("cardType")?.setFilterValue(event.target.value)
              }
            />
            <Input
              placeholder="Фильтр статусов пропусков..."
              value={
                (table.getColumn("cardStatus")?.getFilterValue() as string) ??
                ""
              }
              onChange={(event) =>
                table
                  .getColumn("cardStatus")
                  ?.setFilterValue(event.target.value)
              }
            />

            {user?.user.id && user.session.activeOrganizationId && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleDeleteSelected}
                  disabled={
                    table.getFilteredSelectedRowModel().rows.length === 0
                  }
                >
                  Удалить ({table.getFilteredSelectedRowModel().rows.length})
                  пропусков
                </Button>
                <CreateCardForm
                  userId={user.user.id}
                  organizationId={user.session.activeOrganizationId}
                  onSuccess={fetchCards} // Pass the callback
                />
              </>
            )}
          </div>

          <div className="w-[95%] overflow-hidden rounded-md border">
            <div className="max-h-[80vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
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
        </>
      )}
    </div>
  )
}
