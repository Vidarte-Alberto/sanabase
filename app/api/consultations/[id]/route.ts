import { NextResponse } from "next/server";

import type { ConsultationFormData } from "@/components/pages/dashboard/types/consultation";
import { createUnauthorizedResponse, requireSession } from "@/shared/lib/auth";
import {
  deleteConsultation,
  getConsultationById,
  updateConsultation,
} from "@/shared/server/dashboard/consultations-db";

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
  const data = (await request.json()) as ConsultationFormData;
  const consultation = await updateConsultation(id, data);

  if (!consultation) {
    return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
  }

  return NextResponse.json(consultation);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  const { id } = await context.params;
  const consultation = await getConsultationById(id);

  if (!consultation) {
    return NextResponse.json({ error: "Consulta no encontrada" }, { status: 404 });
  }

  if (session.role !== "admin" && consultation.userId !== session.userId) {
    return createUnauthorizedResponse("No tienes permiso para eliminar esta consulta", 403);
  }

  await deleteConsultation(id);
  return NextResponse.json({ success: true });
}
