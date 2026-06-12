import { NextResponse } from "next/server";

import type { PaymentFormData } from "@/components/pages/dashboard/types/payment";
import { createUnauthorizedResponse, requireSession } from "@/shared/lib/auth";
import { getAppointmentById, updateAppointment } from "@/shared/server/dashboard/appointments-db";
import { createPayment, getAllPayments, getPaymentsByPatient } from "@/shared/server/dashboard/payments-db";
import { getActiveShift } from "@/shared/server/dashboard/shifts-db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  if (patientId) {
    return NextResponse.json(await getPaymentsByPatient(patientId));
  }

  if (session.role !== "admin") {
    return createUnauthorizedResponse("Solo administradores pueden ver todos los pagos", 403);
  }

  return NextResponse.json(await getAllPayments(from, to));
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

  const activeShift = await getActiveShift(session.userId);
  const data = (await request.json()) as PaymentFormData;
  const payment = await createPayment(patientId, session.userId, activeShift?.id ?? null, data);

  if (data.appointmentId) {
    const appt = await getAppointmentById(data.appointmentId);
    if (appt && appt.patientId === patientId && appt.status === "scheduled") {
      await updateAppointment(data.appointmentId, {
        dateTime: appt.dateTime,
        reason: appt.reason,
        status: "completed",
        notes: appt.notes,
      });
    }
  }

  return NextResponse.json(payment, { status: 201 });
}
