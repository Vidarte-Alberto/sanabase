import { NextResponse } from "next/server"

import { createPatient, getPatients } from "@/lib/patients-db"
import type { PatientFormData } from "@/lib/types"

export const runtime = "nodejs"

export async function GET() {
  return NextResponse.json(await getPatients())
}

export async function POST(request: Request) {
  const data = (await request.json()) as PatientFormData
  const patient = await createPatient(data)
  return NextResponse.json(patient, { status: 201 })
}
