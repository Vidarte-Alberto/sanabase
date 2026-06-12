import { NextResponse } from "next/server";

import { createUnauthorizedResponse, requireSession } from "@/shared/lib/auth";
import { deletePayment } from "@/shared/server/dashboard/payments-db";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  if (session.role !== "admin") {
    return createUnauthorizedResponse("Solo administradores pueden eliminar pagos", 403);
  }

  const { id } = await context.params;
  const deleted = await deletePayment(id);

  if (!deleted) {
    return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
