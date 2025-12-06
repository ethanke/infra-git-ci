"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SupportedLocale } from "@/config/site"

type Status = "idle" | "working" | "error"

export function AdminLoginForm({ locale }: { locale: SupportedLocale }) {
  const router = useRouter()
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const key = String(formData.get("adminKey") ?? "").trim()

    if (!key) {
      setErrorMessage("Enter the admin access key to continue.")
      setStatus("error")
      return
    }

    setStatus("working")
    setErrorMessage(null)

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({ key })
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        setErrorMessage(body?.error ?? "Invalid key. Try again or contact the platform team.")
        setStatus("error")
        return
      }

      router.replace(`/${locale}/admin`)
      router.refresh()
    } catch (error) {
      console.error("Failed to establish admin session", error)
      setErrorMessage("We could not reach the server. Retry shortly.")
      setStatus("error")
    } finally {
      setStatus((prev) => (prev === "working" ? "idle" : prev))
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-2xl">Admin access</CardTitle>
        <CardDescription>Authenticate to manage content, categories and tags.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {status === "error" && errorMessage && (
            <Alert variant="destructive">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="adminKey">Admin key</Label>
            <Input id="adminKey" name="adminKey" type="password" autoComplete="off" placeholder="Paste the access key" />
            <p className="text-xs text-muted-foreground">
              The key stays on the server—no client-side exposure. Contact the platform team if you need a reset.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={status === "working"}>
            {status === "working" ? "Checking…" : "Continue"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
