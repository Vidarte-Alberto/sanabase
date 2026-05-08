import { NextResponse } from "next/server";

import { createUnauthorizedResponse, requireSession } from "@/shared/lib/auth";
import { createUser, listUsers } from "@/shared/server/dashboard/user-management";
import type { CreateUserInput } from "@/shared/server/dashboard/user-types";

export const runtime = "nodejs";

function ensureAdmin() {
  return requireSession();
}

export async function GET() {
  const session = await ensureAdmin();

  if (!session) {
    return createUnauthorizedResponse();
  }

  if (session.role !== "admin") {
    return createUnauthorizedResponse("No tienes permisos para administrar usuarios", 403);
  }

  return NextResponse.json(await listUsers());
}

export async function POST(request: Request) {
  const session = await ensureAdmin();

  if (!session) {
    return createUnauthorizedResponse();
  }

  if (session.role !== "admin") {
    return createUnauthorizedResponse("No tienes permisos para administrar usuarios", 403);
  }

  const body = (await request.json()) as Partial<CreateUserInput>;

  if (!body.username || !body.displayName || !body.password || !body.role) {
    return NextResponse.json(
      { error: "Nombre, usuario, rol y contraseña son obligatorios" },
      { status: 400 },
    );
  }

  try {
    const user = await createUser({
      username: body.username,
      displayName: body.displayName,
      password: body.password,
      role: body.role,
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo crear el usuario" },
      { status: 400 },
    );
  }
}
