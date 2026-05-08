"use client"

import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Pencil, Shield, Trash2, UserPlus, Users } from "lucide-react"
import { toast } from "sonner"

import type { AuthSession, UserRole } from "@/lib/auth-types"
import type { CreateUserInput, ManagedUser, UpdateUserInput } from "@/lib/user-types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Empty, EmptyContent, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface UsersManagementProps {
  session: AuthSession
}

interface UserFormState {
  username: string
  displayName: string
  role: UserRole
  password: string
}

const initialFormState: UserFormState = {
  username: "",
  displayName: "",
  role: "user",
  password: "",
}

function roleLabel(role: UserRole) {
  return role === "admin" ? "Administrador" : "Usuario"
}

export function UsersManagement({ session }: UsersManagementProps) {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formState, setFormState] = useState<UserFormState>(initialFormState)

  const isEditing = !!editingUser

  const sortedUsers = useMemo(
    () =>
      [...users].sort((leftUser, rightUser) => {
        if (leftUser.role !== rightUser.role) {
          return leftUser.role === "admin" ? -1 : 1
        }

        return leftUser.displayName.localeCompare(rightUser.displayName)
      }),
    [users]
  )

  async function loadUsers() {
    setIsLoading(true)

    try {
      const response = await fetch("/api/users", { cache: "no-store" })
      const payload = (await response.json()) as ManagedUser[] | { error?: string }

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error : "No se pudieron cargar los usuarios")
      }

      setUsers(payload as ManagedUser[])
    } catch (error) {
      toast.error("Error al cargar usuarios", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
  }, [])

  const openCreateDialog = () => {
    setEditingUser(null)
    setFormState(initialFormState)
    setIsDialogOpen(true)
  }

  const openEditDialog = (user: ManagedUser) => {
    setEditingUser(user)
    setFormState({
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      password: "",
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingUser(null)
    setFormState(initialFormState)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaving(true)

    try {
      const requestBody: Partial<CreateUserInput & UpdateUserInput> = {
        displayName: formState.displayName,
        role: formState.role,
      }

      if (isEditing) {
        if (formState.password.trim()) {
          requestBody.password = formState.password
        }
      } else {
        requestBody.username = formState.username
        requestBody.password = formState.password
      }

      const response = await fetch(
        isEditing ? `/api/users/${editingUser.id}` : "/api/users",
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      )

      const payload = (await response.json()) as ManagedUser | { error?: string }

      if (!response.ok) {
        throw new Error("error" in payload ? payload.error : "No se pudo guardar el usuario")
      }

      const savedUser = payload as ManagedUser

      setUsers((currentUsers) =>
        isEditing
          ? currentUsers.map((currentUser) =>
              currentUser.id === savedUser.id ? savedUser : currentUser
            )
          : [...currentUsers, savedUser]
      )

      toast.success(isEditing ? "Usuario actualizado" : "Usuario creado")
      closeDialog()
    } catch (error) {
      toast.error("Error al guardar usuario", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!userToDelete) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: "DELETE",
      })

      const payload = (await response.json()) as { success?: boolean; error?: string }

      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo eliminar el usuario")
      }

      setUsers((currentUsers) =>
        currentUsers.filter((currentUser) => currentUser.id !== userToDelete.id)
      )

      toast.success("Usuario eliminado")
      setUserToDelete(null)
    } catch (error) {
      toast.error("Error al eliminar usuario", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Administración de Usuarios
            </CardTitle>
            <Button onClick={openCreateDialog}>
              <UserPlus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          ) : sortedUsers.length === 0 ? (
            <Empty className="py-12">
              <EmptyContent>
                <EmptyTitle>Sin usuarios registrados</EmptyTitle>
                <EmptyDescription>
                  Crea la primera cuenta adicional para el personal del consultorio.
                </EmptyDescription>
                <div className="flex justify-center">
                  <Button onClick={openCreateDialog}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear Usuario
                  </Button>
                </div>
              </EmptyContent>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.displayName}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2">
                        {user.role === "admin" ? <Shield className="h-4 w-4 text-primary" /> : null}
                        {roleLabel(user.role)}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString("es-MX")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setUserToDelete(user)}
                          disabled={user.id === session.userId}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar usuario" : "Nuevo usuario"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Actualiza los datos y el rol del usuario."
                : "Crea una nueva cuenta para personal administrativo o médico."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nombre</Label>
              <Input
                id="displayName"
                value={formState.displayName}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    displayName: event.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                value={formState.username}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    username: event.target.value,
                  }))
                }
                required
                disabled={isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formState.role}
                onValueChange={(value) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    role: value as UserRole,
                  }))
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {isEditing ? "Nueva contraseña (opcional)" : "Contraseña"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formState.password}
                onChange={(event) =>
                  setFormState((currentState) => ({
                    ...currentState,
                    password: event.target.value,
                  }))
                }
                required={!isEditing}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : null}
                {isEditing ? "Guardar cambios" : "Crear usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar usuario?</DialogTitle>
            <DialogDescription>
              Estás a punto de eliminar a{" "}
              <span className="font-medium text-foreground">{userToDelete?.displayName}</span>.
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setUserToDelete(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
