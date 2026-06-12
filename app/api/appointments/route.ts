import { NextResponse } from "next/server";

import type { AppointmentFormData } from "@/components/pages/dashboard/types/appointment";
import { createUnauthorizedResponse, requireSession } from "@/shared/lib/auth";
import { createAppointment, getAppointments } from "@/shared/server/dashboard/appointments-db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  return NextResponse.json(await getAppointments({ patientId, status, from, to }));
}

export async function POST(request: Request) {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return NextResponse.json({ error: "patientId requerido" }, { status: 400 });
  }

  const data = (await request.json()) as AppointmentFormData;
  const appointment = await createAppointment(patientId, session.userId, data);
  return NextResponse.json(appointment, { status: 201 });
}
