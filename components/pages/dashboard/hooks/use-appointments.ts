"use client";

import { useCallback, useEffect, useState } from "react";

import type { Appointment, AppointmentFormData } from "../types/appointment";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "No se pudo completar la operación");
  }

  return response.json() as Promise<T>;
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await parseResponse<Appointment[]>(
        await fetch("/api/appointments", { cache: "no-store" }),
      );
      setAppointments(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addAppointment = useCallback(async (patientId: string, data: AppointmentFormData) => {
    const appointment = await parseResponse<Appointment>(
      await fetch(`/api/appointments?patientId=${patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    );

    setAppointments((prev) => [...prev, appointment].sort(
      (a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime(),
    ));
    return appointment;
  }, []);

  const updateAppointment = useCallback(async (id: string, data: AppointmentFormData) => {
    const appointment = await parseResponse<Appointment>(
      await fetch(`/api/appointments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    );

    setAppointments((prev) => prev
      .map((a) => (a.id === id ? appointment : a))
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
    );
    return appointment;
  }, []);

  const deleteAppointment = useCallback(async (id: string) => {
    await parseResponse<{ success: boolean }>(
      await fetch(`/api/appointments/${id}`, { method: "DELETE" }),
    );

    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return { appointments, isLoading, refresh, addAppointment, updateAppointment, deleteAppointment };
}
