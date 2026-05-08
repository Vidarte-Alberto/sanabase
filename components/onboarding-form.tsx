"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Activity, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

export function OnboardingForm() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/auth/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName,
          username,
          password,
        }),
      })

      const payload = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo completar la configuración inicial")
      }

      toast.success("Administrador creado correctamente")
      router.push("/")
      router.refresh()
    } catch (error) {
      toast.error("Error en la configuración inicial", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg border-border/50 shadow-lg">
        <CardHeader className="space-y-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <CardTitle>Configuración Inicial</CardTitle>
              <CardDescription>
                Crea la cuenta del Doctor administrador para iniciar el sistema
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nombre del administrador</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Dr. Juan Pérez"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="doctor"
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
                placeholder="Define una contraseña segura"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repite la contraseña"
                required
              />
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/30 p-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Esta cuenta tendrá permisos de administrador
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              Crear administrador
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
