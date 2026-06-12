import { NextResponse } from "next/server";

import type { ConsultationFormData } from "@/components/pages/dashboard/types/consultation";
import { createUnauthorizedResponse, requireSession } from "@/shared/lib/auth";
import { createConsultation, getConsultationsByPatient } from "@/shared/server/dashboard/consultations-db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get("patientId");

  if (!patientId) {
    return NextResponse.json({ error: "patientId requerido" }, { status: 400 });
  }

  return NextResponse.json(await getConsultationsByPatient(patientId));
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

  const data = (await request.json()) as ConsultationFormData;
  const consultation = await createConsultation(patientId, session.userId, data);
  return NextResponse.json(consultation, { status: 201 });
}
