import "server-only";

import { randomUUID } from "node:crypto";

import type { Payment, PaymentFormData } from "@/components/pages/dashboard/types/payment";
import { prisma } from "@/shared/lib/prisma";

function toPayment(row: {
  id: string
  patientId: string
  userId: string
  shiftId: string | null
  appointmentId: string | null
  consultationId: string | null
  amount: number
  concept: string
  paymentMethod: string
  date: string
  createdAt: string
}): Payment {
  return {
    ...row,
    paymentMethod: row.paymentMethod as Payment["paymentMethod"],
  };
}

export async function getPaymentsByPatient(patientId: string): Promise<Payment[]> {
  const rows = await prisma.payment.findMany({
    where: { patientId },
    orderBy: { date: "desc" },
  });

  return rows.map(toPayment);
}

export async function getPaymentsByShift(shiftId: string): Promise<Payment[]> {
  const rows = await prisma.payment.findMany({
    where: { shiftId },
    orderBy: { createdAt: "asc" },
  });

  return rows.map(toPayment);
}

export async function getAllPayments(from?: string, to?: string): Promise<Payment[]> {
  const rows = await prisma.payment.findMany({
    where: from && to ? { date: { gte: from, lte: to } } : undefined,
    orderBy: { date: "desc" },
  });

  return rows.map(toPayment);
}

export async function createPayment(
  patientId: string,
  userId: string,
  shiftId: string | null,
  data: PaymentFormData,
): Promise<Payment> {
  const row = await prisma.payment.create({
    data: {
      id: randomUUID(),
      patientId,
      userId,
      shiftId,
      ...data,
      createdAt: new Date().toISOString(),
    },
  });

  return toPayment(row);
}

export async function deletePayment(id: string): Promise<boolean> {
  const existing = await prisma.payment.findUnique({ where: { id } });

  if (!existing) {
    return false;
  }

  await prisma.payment.delete({ where: { id } });
  return true;
}
