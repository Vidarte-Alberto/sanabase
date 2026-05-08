"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Activity, LogIn } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

export function LoginForm() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      })

      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo iniciar sesión")
      }

      toast.success("Sesión iniciada")
      router.push("/")
      router.refresh()
    } catch (error) {
      toast.error("Error al iniciar sesión", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-md border-border/50 shadow-lg">
        <CardHeader className="space-y-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>MediGestión</CardTitle>
              <CardDescription>Inicia sesión para continuar</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="doctor o secretaria"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Ingresa tu contraseña"
                required
              />
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm text-muted-foreground">
              <p>Ingresa con un usuario previamente creado en el sistema.</p>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : <LogIn className="mr-2 h-4 w-4" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
