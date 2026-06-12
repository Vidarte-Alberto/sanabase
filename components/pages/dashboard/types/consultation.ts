export interface Consultation {
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
}

export type ConsultationFormData = Omit<Consultation, "id" | "patientId" | "userId" | "createdAt" | "lastUpdated">
