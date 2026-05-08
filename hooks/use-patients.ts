"use client"

import { useCallback, useEffect, useState } from "react"
import type { Patient, PatientFormData } from "@/lib/types"

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(payload?.error ?? "No se pudo completar la operación")
  }

  return response.json() as Promise<T>
}

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshPatients = useCallback(async () => {
    setIsLoading(true)

    try {
      const data = await parseResponse<Patient[]>(await fetch("/api/patients", { cache: "no-store" }))
      setPatients(data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshPatients()
  }, [refreshPatients])

  const addPatient = useCallback(async (data: PatientFormData) => {
    const patient = await parseResponse<Patient>(
      await fetch("/api/patients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
    )

    setPatients((currentPatients) => [patient, ...currentPatients])
    return patient
  }, [])

  const updatePatient = useCallback(async (id: string, data: PatientFormData) => {
    const patient = await parseResponse<Patient>(
      await fetch(`/api/patients/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
    )

    setPatients((currentPatients) =>
      currentPatients.map((currentPatient) => (currentPatient.id === id ? patient : currentPatient))
    )

    return patient
  }, [])

  const deletePatient = useCallback(async (id: string) => {
    await parseResponse<{ success: boolean }>(
      await fetch(`/api/patients/${id}`, {
        method: "DELETE",
      })
    )

    setPatients((currentPatients) =>
      currentPatients.filter((currentPatient) => currentPatient.id !== id)
    )

    return true
  }, [])

  const getPatient = useCallback((id: string): Patient | undefined => {
    return patients.find((patient) => patient.id === id)
  }, [patients])

  const searchPatients = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase()
    return patients.filter(
      (patient) =>
        patient.fullName.toLowerCase().includes(lowerQuery) ||
        patient.email.toLowerCase().includes(lowerQuery) ||
        patient.phone.includes(query)
    )
  }, [patients])

  return {
    patients,
    isLoading,
    refreshPatients,
    addPatient,
    updatePatient,
    deletePatient,
    getPatient,
    searchPatients,
  }
}
