"use client";

import { useCallback, useEffect, useState } from "react";

import type { Shift, ShiftSummary } from "../types/shift";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "No se pudo completar la operación");
  }

  return response.json() as Promise<T>;
}

export function useShifts() {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const [active, history] = await Promise.all([
        parseResponse<Shift | null>(await fetch("/api/shifts/active", { cache: "no-store" })),
        parseResponse<Shift[]>(await fetch("/api/shifts", { cache: "no-store" })),
      ]);
      setActiveShift(active);
      setShifts(history);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const startShift = useCallback(async () => {
    const shift = await parseResponse<Shift>(
      await fetch("/api/shifts", { method: "POST" }),
    );

    setActiveShift(shift);
    setShifts((prev) => [shift, ...prev]);
    return shift;
  }, []);

  const closeShift = useCallback(async (id: string) => {
    const shift = await parseResponse<Shift>(
      await fetch(`/api/shifts/${id}`, { method: "PUT" }),
    );

    setActiveShift(null);
    setShifts((prev) => prev.map((s) => (s.id === id ? shift : s)));
    return shift;
  }, []);

  const getShiftSummary = useCallback(async (id: string) => parseResponse<ShiftSummary>(
    await fetch(`/api/shifts/${id}`, { cache: "no-store" }),
  ), []);

  return { activeShift, shifts, isLoading, refresh, startShift, closeShift, getShiftSummary };
}
