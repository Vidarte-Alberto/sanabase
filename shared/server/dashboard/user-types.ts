import type { UserRole } from "@/shared/lib/auth-types"

export interface ManagedUser {
  id: string
  username: string
  displayName: string
  role: UserRole
  createdAt: string
  lastUpdated: string
}

export interface CreateUserInput {
  username: string
  displayName: string
  role: UserRole
  password: string
}

export interface UpdateUserInput {
  displayName: string
  role: UserRole
  password?: string
}
