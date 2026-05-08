import { NextResponse } from "next/server";

import type { PatientFormData } from "@/components/pages/dashboard/types";
import { createUnauthorizedResponse, requireSession } from "@/shared/lib/auth";
import { createPatient, getPatients } from "@/shared/server/dashboard/patients-db";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  return NextResponse.json(await getPatients());
}

export async function POST(request: Request) {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  const data = (await request.json()) as PatientFormData;
  const patient = await createPatient(data);
  return NextResponse.json(patient, { status: 201 });
}
