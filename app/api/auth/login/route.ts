import { NextResponse } from "next/server"

import { authenticateUser, createSessionCookie, hasUsers } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (!(await hasUsers())) {
    return NextResponse.json(
      { error: "Primero debes completar la configuración inicial del sistema" },
      { status: 409 }
    )
  }

  const body = (await request.json()) as {
    username?: string
    password?: string
  }

  if (!body.username || !body.password) {
    return NextResponse.json(
      { error: "Usuario y contraseña son obligatorios" },
      { status: 400 }
    )
  }

  const session = await authenticateUser(body.username, body.password)

  if (!session) {
    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 }
    )
  }

  await createSessionCookie(session)

  return NextResponse.json({
    user: session,
  })
}
