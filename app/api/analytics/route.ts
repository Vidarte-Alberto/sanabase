import { NextResponse } from "next/server";

import { createUnauthorizedResponse, requireSession } from "@/shared/lib/auth";
import { prisma } from "@/shared/lib/prisma";
import { getAllPayments } from "@/shared/server/dashboard/payments-db";

export const runtime = "nodejs";

function dateRange(period: string): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split("T")[0];
  let from: Date;

  if (period === "week") {
    from = new Date(now);
    from.setDate(now.getDate() - 6);
  } else if (period === "month") {
    from = new Date(now);
    from.setDate(now.getDate() - 29);
  } else {
    from = new Date(now);
  }

  return { from: from.toISOString().split("T")[0], to };
}

export async function GET(request: Request) {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  if (session.role !== "admin") {
    return createUnauthorizedResponse("Solo administradores pueden ver el dashboard", 403);
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") ?? "today";
  const { from, to } = dateRange(period);

  const [payments, consultations, newPatients, totalPatients] = await Promise.all([
    getAllPayments(from, to),
    prisma.consultation.count({ where: { date: { gte: from, lte: to } } }),
    prisma.patient.count({ where: { registrationDate: { gte: from, lte: to } } }),
    prisma.patient.count(),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const byMethod = { cash: 0, card: 0, transfer: 0 };

  for (const p of payments) {
    const method = p.paymentMethod as keyof typeof byMethod;
    if (method in byMethod) {
      byMethod[method] += p.amount;
    }
  }

  return NextResponse.json({
    period,
    from,
    to,
    totalRevenue,
    paymentCount: payments.length,
    consultationCount: consultations,
    newPatients,
    totalPatients,
    byMethod,
  });
}
