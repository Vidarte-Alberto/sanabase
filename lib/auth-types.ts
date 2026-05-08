export type UserRole = "admin" | "user"

export interface AuthSession {
  userId: string
  username: string
  displayName: string
  role: UserRole
}
