import { NextResponse } from "next/server"
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client"

import { createInitialAdmin, createSessionCookie, hasUsers } from "@/lib/auth"

export const runtime = "nodejs"

export async function POST(request: Request) {
  if (await hasUsers()) {
    return NextResponse.json(
      { error: "El onboarding inicial ya fue completado" },
      { status: 409 }
    )
  }

  const body = (await request.json()) as {
    username?: string
    displayName?: string
    password?: string
  }

  if (!body.username || !body.displayName || !body.password) {
    return NextResponse.json(
      { error: "Nombre, usuario y contraseña son obligatorios" },
      { status: 400 }
    )
  }

  try {
    const session = await createInitialAdmin({
      username: body.username,
      displayName: body.displayName,
      password: body.password,
    })

    await createSessionCookie(session)

    return NextResponse.json({ user: session }, { status: 201 })
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "Ese nombre de usuario ya existe" },
        { status: 409 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: "No se pudo completar la configuración inicial" },
      { status: 500 }
    )
  }
}
