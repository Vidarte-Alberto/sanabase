export type ShiftStatus = "open" | "closed"

export interface Shift {
  id: string
  userId: string
  startTime: string
  endTime: string | null
  status: ShiftStatus
  notes: string
}

export interface ShiftSummary {
  shift: Shift
  totalAmount: number
  byMethod: {
    cash: number
    card: number
    transfer: number
  }
  paymentCount: number
}
