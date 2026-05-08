import "server-only"

import { randomUUID } from "node:crypto"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { jwtVerify, SignJWT } from "jose"
import type { AuthSession } from "@/lib/auth-types"
import { prisma } from "@/lib/prisma"
import { hashPassword, verifyPassword } from "@/lib/password"

const SESSION_COOKIE_NAME = "medigest_session"
const SESSION_DURATION_SECONDS = 60 * 60 * 8

const jwtSecret = process.env.JWT_SECRET ?? "change-this-in-production"
const secretKey = new TextEncoder().encode(jwtSecret)

function buildSessionToken(session: AuthSession) {
  return new SignJWT({
    userId: session.userId,
    username: session.username,
    displayName: session.displayName,
    role: session.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey)
}

export async function hasUsers() {
  return (await prisma.user.count()) > 0
}

export async function createInitialAdmin(input: {
  username: string
  displayName: string
  password: string
}): Promise<AuthSession> {
  if (await hasUsers()) {
    throw new Error("El onboarding inicial ya fue completado")
  }

  const now = new Date().toISOString()
  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      username: input.username,
      displayName: input.displayName,
      role: "admin",
      passwordHash: await hashPassword(input.password),
      createdAt: now,
      lastUpdated: now,
    },
  })

  return {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role as AuthSession["role"],
  }
}

export async function authenticateUser(username: string, password: string): Promise<AuthSession | null> {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
  })

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return null
  }

  return {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role as AuthSession["role"],
  }
}

export async function createSessionCookie(session: AuthSession) {
  const token = await buildSessionToken(session)
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
}

export async function getSession(): Promise<AuthSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, secretKey)

    if (
      typeof payload.userId !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.displayName !== "string" ||
      (payload.role !== "admin" && payload.role !== "user")
    ) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
    })

    if (!user) {
      return null
    }

    return {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role as AuthSession["role"],
    }
  } catch {
    return null
  }
}

export async function requireSession() {
  const session = await getSession()

  if (!session) {
    return null
  }

  return session
}

export function createUnauthorizedResponse(message = "No autorizado", status = 401) {
  return NextResponse.json({ error: message }, { status })
}
