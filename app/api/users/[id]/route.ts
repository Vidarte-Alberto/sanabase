import { NextResponse } from "next/server";

import { createUnauthorizedResponse, requireSession } from "@/shared/lib/auth";
import { deleteUser, updateUser } from "@/shared/server/dashboard/user-management";
import type { UpdateUserInput } from "@/shared/server/dashboard/user-types";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  if (session.role !== "admin") {
    return createUnauthorizedResponse("No tienes permisos para administrar usuarios", 403);
  }

  const { id } = await context.params;
  const body = (await request.json()) as Partial<UpdateUserInput>;

  if (!body.displayName || !body.role) {
    return NextResponse.json(
      { error: "Nombre y rol son obligatorios" },
      { status: 400 },
    );
  }

  try {
    const user = await updateUser(
      id,
      {
        displayName: body.displayName,
        role: body.role,
        password: body.password,
      },
      session.userId,
    );

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo actualizar el usuario" },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  if (session.role !== "admin") {
    return createUnauthorizedResponse("No tienes permisos para administrar usuarios", 403);
  }

  const { id } = await context.params;

  try {
    await deleteUser(id, session.userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo eliminar el usuario" },
      { status: 400 },
    );
  }
}
