import { randomUUID } from "node:crypto";

import type { Patient, PatientFormData } from "@/components/pages/dashboard/types";
import { prisma } from "@/shared/lib/prisma";

function today() {
  return new Date().toISOString().split("T")[0];
}

function toPatient(
  patient: Awaited<ReturnType<typeof prisma.patient.findUnique>>,
): Patient | undefined {
  if (!patient) {
    return undefined;
  }

  return {
    ...patient,
    gender: patient.gender as Patient["gender"],
    bloodType: patient.bloodType as Patient["bloodType"],
  };
}

export async function getPatients(): Promise<Patient[]> {
  const patients = await prisma.patient.findMany({
    orderBy: [{ registrationDate: "desc" }, { fullName: "asc" }],
  });

  return patients.map((patient) => toPatient(patient) as Patient);
}

export async function getPatientById(id: string): Promise<Patient | undefined> {
  const patient = await prisma.patient.findUnique({
    where: { id },
  });

  return toPatient(patient);
}

export async function createPatient(data: PatientFormData): Promise<Patient> {
  const now = today();
  const patient = await prisma.patient.create({
    data: {
      ...data,
      id: randomUUID(),
      registrationDate: now,
      lastUpdated: now,
    },
  });

  return toPatient(patient) as Patient;
}

export async function updatePatient(id: string, data: PatientFormData): Promise<Patient | undefined> {
  const existingPatient = await getPatientById(id);

  if (!existingPatient) {
    return undefined;
  }

  const patient = await prisma.patient.update({
    where: { id },
    data: {
      ...data,
      lastUpdated: today(),
    },
  });

  return toPatient(patient) as Patient;
}

export async function deletePatient(id: string): Promise<boolean> {
  const existingPatient = await getPatientById(id);

  if (!existingPatient) {
    return false;
  }

  await prisma.patient.delete({
    where: { id },
  });

  return true;
}
