import { NextResponse } from "next/server"

import { createUnauthorizedResponse, requireSession } from "@/lib/auth"
import { createPatient, getPatients } from "@/lib/patients-db"
import type { PatientFormData } from "@/lib/types"

export const runtime = "nodejs"

export async function GET() {
  const session = await requireSession()

  if (!session) {
    return createUnauthorizedResponse()
  }

  return NextResponse.json(await getPatients())
}

export async function POST(request: Request) {
  const session = await requireSession()

  if (!session) {
    return createUnauthorizedResponse()
  }

  const data = (await request.json()) as PatientFormData
  const patient = await createPatient(data)
  return NextResponse.json(patient, { status: 201 })
}
