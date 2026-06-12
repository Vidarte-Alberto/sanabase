import { NextResponse } from "next/server";

import { createUnauthorizedResponse, requireSession } from "@/shared/lib/auth";
import { closeShift, getShiftSummary } from "@/shared/server/dashboard/shifts-db";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  const { id } = await context.params;
  const summary = await getShiftSummary(id);

  if (!summary) {
    return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });
  }

  if (session.role !== "admin" && summary.shift.userId !== session.userId) {
    return createUnauthorizedResponse("No tienes permiso para ver este turno", 403);
  }

  return NextResponse.json(summary);
}

export async function PUT(_request: Request, context: RouteContext) {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  const { id } = await context.params;

  try {
    const shift = await closeShift(id, session.userId);
    return NextResponse.json(shift);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo cerrar el turno" },
      { status: 409 },
    );
  }
}
