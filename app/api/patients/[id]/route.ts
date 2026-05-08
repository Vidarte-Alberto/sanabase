import { NextResponse } from "next/server"

import { deletePatient, getPatientById, updatePatient } from "@/lib/patients-db"
import type { PatientFormData } from "@/lib/types"

export const runtime = "nodejs"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const patient = await getPatientById(id)

  if (!patient) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
  }

  return NextResponse.json(patient)
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params
  const data = (await request.json()) as PatientFormData
  const patient = await updatePatient(id, data)

  if (!patient) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
  }

  return NextResponse.json(patient)
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params
  const deleted = await deletePatient(id)

  if (!deleted) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
