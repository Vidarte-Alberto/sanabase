import "server-only";

import { randomUUID } from "node:crypto";

import type { Appointment, AppointmentFormData } from "@/components/pages/dashboard/types/appointment";
import { prisma } from "@/shared/lib/prisma";

function toAppointment(row: {
  id: string
  patientId: string
  userId: string
  dateTime: string
  reason: string
  status: string
  notes: string
  createdAt: string
  lastUpdated: string
}): Appointment {
  return {
    ...row,
    status: row.status as Appointment["status"],
  };
}

interface AppointmentFilter {
  patientId?: string
  status?: string
  from?: string
  to?: string
}

export async function getAppointments(filter: AppointmentFilter = {}): Promise<Appointment[]> {
  const rows = await prisma.appointment.findMany({
    where: {
      ...(filter.patientId ? { patientId: filter.patientId } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.from || filter.to
        ? { dateTime: { ...(filter.from ? { gte: filter.from } : {}), ...(filter.to ? { lte: filter.to } : {}) } }
        : {}),
    },
    orderBy: { dateTime: "asc" },
  });

  return rows.map(toAppointment);
}

export async function getAppointmentById(id: string): Promise<Appointment | undefined> {
  const row = await prisma.appointment.findUnique({ where: { id } });
  return row ? toAppointment(row) : undefined;
}

export async function createAppointment(
  patientId: string,
  userId: string,
  data: AppointmentFormData,
): Promise<Appointment> {
  const now = new Date().toISOString();
  const row = await prisma.appointment.create({
    data: {
      id: randomUUID(),
      patientId,
      userId,
      ...data,
      createdAt: now,
      lastUpdated: now,
    },
  });

  return toAppointment(row);
}

export async function updateAppointment(
  id: string,
  data: AppointmentFormData,
): Promise<Appointment | undefined> {
  const existing = await getAppointmentById(id);

  if (!existing) {
    return undefined;
  }

  const row = await prisma.appointment.update({
    where: { id },
    data: { ...data, lastUpdated: new Date().toISOString() },
  });

  return toAppointment(row);
}

export async function deleteAppointment(id: string): Promise<boolean> {
  const existing = await getAppointmentById(id);

  if (!existing) {
    return false;
  }

  await prisma.appointment.delete({ where: { id } });
  return true;
}
