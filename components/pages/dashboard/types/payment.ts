export type PaymentMethod = "cash" | "card" | "transfer"

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
};

export const PAYMENT_METHODS: PaymentMethod[] = ["cash", "card", "transfer"];

export interface Payment {
  id: string
  patientId: string
  userId: string
  shiftId: string | null
  appointmentId: string | null
  consultationId: string | null
  amount: number
  concept: string
  paymentMethod: PaymentMethod
  date: string
  createdAt: string
}

export type PaymentFormData = Omit<Payment, "id" | "patientId" | "userId" | "shiftId" | "createdAt">
