"use client";

import { useCallback, useEffect, useState } from "react";

import type { Consultation, ConsultationFormData } from "../types/consultation";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "No se pudo completar la operación");
  }

  return response.json() as Promise<T>;
}

export function useConsultations(patientId: string) {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await parseResponse<Consultation[]>(
        await fetch(`/api/consultations?patientId=${patientId}`, { cache: "no-store" }),
      );
      setConsultations(data);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addConsultation = useCallback(async (data: ConsultationFormData) => {
    const consultation = await parseResponse<Consultation>(
      await fetch(`/api/consultations?patientId=${patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    );

    setConsultations((prev) => [consultation, ...prev]);
    return consultation;
  }, [patientId]);

  const updateConsultation = useCallback(async (id: string, data: ConsultationFormData) => {
    const consultation = await parseResponse<Consultation>(
      await fetch(`/api/consultations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    );

    setConsultations((prev) => prev.map((c) => (c.id === id ? consultation : c)));
    return consultation;
  }, []);

  const deleteConsultation = useCallback(async (id: string) => {
    await parseResponse<{ success: boolean }>(
      await fetch(`/api/consultations/${id}`, { method: "DELETE" }),
    );

    setConsultations((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { consultations, isLoading, refresh, addConsultation, updateConsultation, deleteConsultation };
}
