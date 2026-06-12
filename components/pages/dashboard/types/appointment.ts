export type AppointmentStatus = "scheduled" | "completed" | "cancelled"

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: "Agendada",
  completed: "Completada",
  cancelled: "Cancelada",
};

export const APPOINTMENT_STATUSES: AppointmentStatus[] = ["scheduled", "completed", "cancelled"];

export interface Appointment {
  id: string
  patientId: string
  userId: string
  dateTime: string
  reason: string
  status: AppointmentStatus
  notes: string
  createdAt: string
  lastUpdated: string
}

export type AppointmentFormData = Omit<Appointment, "id" | "patientId" | "userId" | "createdAt" | "lastUpdated">
