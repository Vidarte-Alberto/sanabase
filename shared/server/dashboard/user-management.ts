import "server-only"

import { randomUUID } from "node:crypto"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client"

import { prisma } from "@/shared/lib/prisma"
import { hashPassword } from "@/shared/lib/password"
import { validatePasswordStrength } from "@/shared/lib/password-policy"
import type { UserRole } from "@/shared/lib/auth-types"
import type { CreateUserInput, ManagedUser, UpdateUserInput } from "@/shared/server/dashboard/user-types"

function toManagedUser(user: {
  id: string
  username: string
  displayName: string
  role: string
  createdAt: string
  lastUpdated: string
}): ManagedUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role as UserRole,
    createdAt: user.createdAt,
    lastUpdated: user.lastUpdated,
  }
}

export async function listUsers(): Promise<ManagedUser[]> {
  const users = await prisma.user.findMany({
    orderBy: [{ role: "asc" }, { displayName: "asc" }],
  })

  return users.map(toManagedUser)
}

export async function createUser(input: CreateUserInput): Promise<ManagedUser> {
  const now = new Date().toISOString()
  const passwordValidation = validatePasswordStrength(input.password)

  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.errors[0])
  }

  try {
    const user = await prisma.user.create({
      data: {
        id: randomUUID(),
        username: input.username.trim(),
        displayName: input.displayName,
        role: input.role,
        passwordHash: await hashPassword(input.password),
        createdAt: now,
        lastUpdated: now,
      },
    })

    return toManagedUser(user)
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Ese nombre de usuario ya existe")
    }

    throw error
  }
}

async function countAdmins() {
  return prisma.user.count({
    where: {
      role: "admin",
    },
  })
}

export async function updateUser(
  userId: string,
  input: UpdateUserInput,
  currentUserId: string
): Promise<ManagedUser> {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!existingUser) {
    throw new Error("Usuario no encontrado")
  }

  if (existingUser.role === "admin" && input.role !== "admin") {
    const adminCount = await countAdmins()

    if (adminCount <= 1) {
      throw new Error("Debe existir al menos un administrador en el sistema")
    }
  }

  if (existingUser.id === currentUserId && input.role !== "admin") {
    throw new Error("No puedes quitarte a ti mismo el rol de administrador")
  }

  if (input.password) {
    const passwordValidation = validatePasswordStrength(input.password)

    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors[0])
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: input.displayName,
        role: input.role,
        ...(input.password
          ? {
              passwordHash: await hashPassword(input.password),
            }
          : {}),
        lastUpdated: new Date().toISOString(),
      },
    })

    return toManagedUser(user)
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("Ese nombre de usuario ya existe")
    }

    throw error
  }
}

export async function deleteUser(userId: string, currentUserId: string): Promise<void> {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!existingUser) {
    throw new Error("Usuario no encontrado")
  }

  if (existingUser.id === currentUserId) {
    throw new Error("No puedes eliminar tu propio usuario")
  }

  if (existingUser.role === "admin") {
    const adminCount = await countAdmins()

    if (adminCount <= 1) {
      throw new Error("No puedes eliminar al último administrador del sistema")
    }
  }

  await prisma.user.delete({
    where: { id: userId },
  })
}
