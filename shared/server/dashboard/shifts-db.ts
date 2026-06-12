import "server-only";

import { randomUUID } from "node:crypto";

import type { Shift, ShiftSummary } from "@/components/pages/dashboard/types/shift";
import { prisma } from "@/shared/lib/prisma";

function toShift(row: {
  id: string
  userId: string
  startTime: string
  endTime: string | null
  status: string
  notes: string
}): Shift {
  return {
    ...row,
    status: row.status as Shift["status"],
  };
}

export async function getActiveShift(userId: string): Promise<Shift | null> {
  const row = await prisma.shift.findFirst({
    where: { userId, status: "open" },
    orderBy: { startTime: "desc" },
  });

  return row ? toShift(row) : null;
}

export async function getShiftsByUser(userId: string): Promise<Shift[]> {
  const rows = await prisma.shift.findMany({
    where: { userId },
    orderBy: { startTime: "desc" },
  });

  return rows.map(toShift);
}

export async function getAllShifts(): Promise<Shift[]> {
  const rows = await prisma.shift.findMany({
    orderBy: { startTime: "desc" },
  });

  return rows.map(toShift);
}

export async function getShiftById(id: string): Promise<Shift | null> {
  const row = await prisma.shift.findUnique({ where: { id } });
  return row ? toShift(row) : null;
}

export async function startShift(userId: string): Promise<Shift> {
  const existing = await getActiveShift(userId);

  if (existing) {
    throw new Error("Ya tienes un turno activo");
  }

  const row = await prisma.shift.create({
    data: {
      id: randomUUID(),
      userId,
      startTime: new Date().toISOString(),
      endTime: null,
      status: "open",
      notes: "",
    },
  });

  return toShift(row);
}

export async function closeShift(id: string, userId: string): Promise<Shift> {
  const existing = await getShiftById(id);

  if (!existing) {
    throw new Error("Turno no encontrado");
  }

  if (existing.userId !== userId) {
    throw new Error("No tienes permiso para cerrar este turno");
  }

  if (existing.status === "closed") {
    throw new Error("Este turno ya está cerrado");
  }

  const row = await prisma.shift.update({
    where: { id },
    data: { status: "closed", endTime: new Date().toISOString() },
  });

  return toShift(row);
}

export async function getShiftSummary(shiftId: string): Promise<ShiftSummary | null> {
  const shift = await getShiftById(shiftId);

  if (!shift) {
    return null;
  }

  const payments = await prisma.payment.findMany({ where: { shiftId } });

  const byMethod = { cash: 0, card: 0, transfer: 0 };

  for (const p of payments) {
    const method = p.paymentMethod as keyof typeof byMethod;
    if (method in byMethod) {
      byMethod[method] += p.amount;
    }
  }

  return {
    shift,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    byMethod,
    paymentCount: payments.length,
  };
}
