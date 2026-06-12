import "server-only";

import { randomUUID } from "node:crypto";

import type { Consultation, ConsultationFormData } from "@/components/pages/dashboard/types/consultation";
import { prisma } from "@/shared/lib/prisma";

function toConsultation(row: {
  id: string
  patientId: string
  userId: string
  date: string
  reason: string
  diagnosis: string
  treatment: string
  notes: string
  createdAt: string
  lastUpdated: string
}): Consultation {
  return row;
}

export async function getConsultationsByPatient(patientId: string): Promise<Consultation[]> {
  const rows = await prisma.consultation.findMany({
    where: { patientId },
    orderBy: { date: "desc" },
  });

  return rows.map(toConsultation);
}

export async function getConsultationById(id: string): Promise<Consultation | undefined> {
  const row = await prisma.consultation.findUnique({ where: { id } });
  return row ? toConsultation(row) : undefined;
}

export async function createConsultation(
  patientId: string,
  userId: string,
  data: ConsultationFormData,
): Promise<Consultation> {
  const now = new Date().toISOString();
  const row = await prisma.consultation.create({
    data: {
      id: randomUUID(),
      patientId,
      userId,
      ...data,
      createdAt: now,
      lastUpdated: now,
    },
  });

  return toConsultation(row);
}

export async function updateConsultation(
  id: string,
  data: ConsultationFormData,
): Promise<Consultation | undefined> {
  const existing = await getConsultationById(id);

  if (!existing) {
    return undefined;
  }

  const row = await prisma.consultation.update({
    where: { id },
    data: { ...data, lastUpdated: new Date().toISOString() },
  });

  return toConsultation(row);
}

export async function deleteConsultation(id: string): Promise<boolean> {
  const existing = await getConsultationById(id);

  if (!existing) {
    return false;
  }

  await prisma.consultation.delete({ where: { id } });
  return true;
}
