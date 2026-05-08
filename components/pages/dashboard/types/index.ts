export type Gender = "Male" | "Female" | "Other"
export type BloodType = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-"

export interface Patient {
  id: string
  fullName: string
  age: number
  gender: Gender
  birthDate: string
  phone: string
  address: string
  email: string
  bloodType: BloodType
  allergies: string
  medicalHistory: string
  consultationReason: string
  notes: string
  registrationDate: string
  lastUpdated: string
}

export type PatientFormData = Omit<Patient, "id" | "registrationDate" | "lastUpdated">

export const BLOOD_TYPES: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]

export const GENDER_OPTIONS: Gender[] = ["Male", "Female", "Other"]

export const GENDER_LABELS: Record<Gender, string> = {
  Male: "Masculino",
  Female: "Femenino",
  Other: "Otro",
}
