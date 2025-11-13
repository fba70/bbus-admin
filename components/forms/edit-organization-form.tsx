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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { useState } from "react"
import { Loader2, SquarePen } from "lucide-react"
import { Organization } from "@/db/schema"

const formSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50),
  taxId: z.string().min(10).max(12),
  logo: z.string().optional(),
})

export function EditOrganizationForm({
  onSuccess,
  organization,
}: {
  onSuccess: () => void
  organization: Organization
}) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: organization.name,
      slug: organization?.slug || undefined,
      taxId: organization?.metadata
        ? JSON.parse(organization.metadata).taxId || ""
        : "",
      logo: organization?.metadata
        ? JSON.parse(organization.metadata).logo || ""
        : "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)
      await authClient.organization.update({
        data: {
          name: values.name,
          slug: values.slug,
          metadata: { taxId: values.taxId, logo: values.logo },
          logo: "",
        },
        organizationId: organization.id,
      })

      onSuccess()
      toast.success("Organization updated successfully")
    } catch (error) {
      console.error(error)
      toast.error("Failed to update organization")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <SquarePen />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Редактировать организацию</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название</FormLabel>
                  <FormControl>
                    <Input placeholder="ООО Ромашка" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="my-org" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="taxId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ИНН</FormLabel>
                  <FormControl>
                    <Input placeholder="1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Логотип</FormLabel>
                  <p className="text-xs text-muted-foreground mb-2">
                    Логотип должен быть в формате PNG/JPG и не превышать 500 Кб
                  </p>
                  {/* Display current logo */}
                  {field.value && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-2">
                        Текущий логотип:
                      </p>
                      <div style={{ width: 100, height: 100 }}>
                        <img
                          src={`data:image/png;base64,${field.value}`}
                          alt="Current Logo"
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                            border: "1px solid #ddd",
                            borderRadius: "4px",
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (event) => {
                        const file = event.target.files?.[0]
                        if (!file) {
                          toast.error("Please select a logo file.")
                          return
                        }

                        // Check file size (500 KB limit)
                        const maxSize = 500 * 1024 // 500 KB
                        if (file.size > maxSize) {
                          toast.error("File size exceeds 500 KB.")
                          return
                        }

                        // Convert file to Base64
                        const reader = new FileReader()
                        reader.onload = () => {
                          const base64String = reader.result
                            ?.toString()
                            .split(",")[1] // Extract Base64 string
                          form.setValue("logo", base64String || "") // Set Base64 string in form
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button disabled={isLoading} type="submit">
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Обновить клиента"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
