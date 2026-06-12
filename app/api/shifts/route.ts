import { NextResponse } from "next/server";

import { createUnauthorizedResponse, requireSession } from "@/shared/lib/auth";
import { getAllShifts, getShiftsByUser, startShift } from "@/shared/server/dashboard/shifts-db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true";

  if (all && session.role !== "admin") {
    return createUnauthorizedResponse("Solo administradores pueden ver todos los turnos", 403);
  }

  const shifts = all ? await getAllShifts() : await getShiftsByUser(session.userId);
  return NextResponse.json(shifts);
}

export async function POST() {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  try {
    const shift = await startShift(session.userId);
    return NextResponse.json(shift, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudo iniciar el turno" },
      { status: 409 },
    );
  }
}
