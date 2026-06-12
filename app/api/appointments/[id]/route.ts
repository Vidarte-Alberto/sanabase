import { NextResponse } from "next/server";

import type { AppointmentFormData } from "@/components/pages/dashboard/types/appointment";
import { createUnauthorizedResponse, requireSession } from "@/shared/lib/auth";
import {
  deleteAppointment,
  getAppointmentById,
  updateAppointment,
} from "@/shared/server/dashboard/appointments-db";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  const { id } = await context.params;
  const existing = await getAppointmentById(id);

  if (!existing) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  if (session.role !== "admin" && existing.userId !== session.userId) {
    return createUnauthorizedResponse("No tienes permiso para editar esta cita", 403);
  }

  const data = (await request.json()) as AppointmentFormData;
  const appointment = await updateAppointment(id, data);
  return NextResponse.json(appointment);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  const { id } = await context.params;
  const existing = await getAppointmentById(id);

  if (!existing) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  if (session.role !== "admin" && existing.userId !== session.userId) {
    return createUnauthorizedResponse("No tienes permiso para eliminar esta cita", 403);
  }

  await deleteAppointment(id);
  return NextResponse.json({ success: true });
}
