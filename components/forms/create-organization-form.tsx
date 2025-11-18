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

const formSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50),
  taxId: z.string().min(10).max(12),
  logo: z.string().optional(),
})

export function CreateOrganizationForm({
  onSuccess,
}: {
  onSuccess: () => void
}) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      slug: "",
      taxId: "",
      logo: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true)

      await authClient.organization.create({
        name: values.name,
        slug: values.slug,
        metadata: { taxId: values.taxId, logo: values.logo },
        keepCurrentActiveOrganization: false,
        logo: "",
      })

      onSuccess()
      toast.success("Organization created successfully")
    } catch (error) {
      console.error(error)
      toast.error("Failed to create organization")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">Создать клиента</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Создать организацию</DialogTitle>
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
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/png, image/jpeg" // Allow both PNG and JPEG
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

                        // Check file type (PNG or JPEG)
                        const allowedTypes = ["image/png", "image/jpeg"]
                        if (!allowedTypes.includes(file.type)) {
                          toast.error(
                            "Invalid file type. Only PNG and JPEG are allowed."
                          )
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
                "Создать клиента"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
