import { NextResponse } from "next/server"

import { createUnauthorizedResponse, requireSession } from "@/shared/lib/auth"
import type { PatientFormData } from "@/components/pages/dashboard/types"
import { deletePatient, getPatientById, updatePatient } from "@/shared/server/dashboard/patients-db"

export const runtime = "nodejs"

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireSession()

  if (!session) {
    return createUnauthorizedResponse()
  }

  const { id } = await context.params
  const patient = await getPatientById(id)

  if (!patient) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
  }

  return NextResponse.json(patient)
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await requireSession()

  if (!session) {
    return createUnauthorizedResponse()
  }

  const { id } = await context.params
  const data = (await request.json()) as PatientFormData
  const patient = await updatePatient(id, data)

  if (!patient) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
  }

  return NextResponse.json(patient)
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession()

  if (!session) {
    return createUnauthorizedResponse()
  }

  if (session.role !== "admin") {
    return createUnauthorizedResponse("No tienes permisos para eliminar pacientes", 403)
  }

  const { id } = await context.params
  const deleted = await deletePatient(id)

  if (!deleted) {
    return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
