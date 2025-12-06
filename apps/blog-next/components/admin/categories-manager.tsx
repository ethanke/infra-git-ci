"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { SupportedLocale } from "@/config/site"

interface CategoryRecord {
  id: string
  slug: string
  translations: { locale: string; name: string }[]
}

export function CategoriesManager({ locale }: { locale: SupportedLocale }) {
  const [name, setName] = useState("")
  const [slug, setSlug] = useState("")
  const [items, setItems] = useState<CategoryRecord[]>([])
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle")

  const load = async () => {
    const res = await fetch("/api/categories", {
      credentials: "same-origin"
    })
    if (res.ok) {
      const body = await res.json()
      setItems(body)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async () => {
    setStatus("saving")
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "same-origin",
      body: JSON.stringify({ slug, translations: [{ locale, name }] })
    })
    if (response.ok) {
      setName("")
      setSlug("")
      setStatus("idle")
      load()
    } else {
      setStatus("error")
    }
  }

  return (
    <div className="space-y-8">
      <Card className="bg-card/70">
        <CardHeader>
          <CardTitle>Add new category</CardTitle>
          <CardDescription>Slug is shared across locales; the label is translated per language.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {status === "error" && (
            <Alert variant="destructive">
              <AlertDescription>Unable to save category. Check API key configuration.</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={slug} onChange={(event) => setSlug(event.target.value)} placeholder="e.g. platform" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Label ({locale})</Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Platform updates" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={submit} disabled={status === "saving" || !name.trim() || !slug.trim()}>
              {status === "saving" ? "Saving…" : "Add category"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/70">
        <CardHeader>
          <CardTitle>Existing categories</CardTitle>
          <CardDescription>Localised names per language with slug references.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slug</TableHead>
                <TableHead>Translations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.slug}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.translations.map((translation) => (
                      <span key={`${item.id}-${translation.locale}`} className="mr-2 inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1 text-xs uppercase">
                        <span className="font-medium text-foreground">{translation.locale}</span>
                        <span>{translation.name}</span>
                      </span>
                    ))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
