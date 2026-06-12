"use client";

import { useCallback, useEffect, useState } from "react";

import type { Payment, PaymentFormData } from "../types/payment";

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "No se pudo completar la operación");
  }

  return response.json() as Promise<T>;
}

export function usePayments(patientId: string) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await parseResponse<Payment[]>(
        await fetch(`/api/payments?patientId=${patientId}`, { cache: "no-store" }),
      );
      setPayments(data);
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const addPayment = useCallback(async (data: PaymentFormData) => {
    const payment = await parseResponse<Payment>(
      await fetch(`/api/payments?patientId=${patientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    );

    setPayments((prev) => [payment, ...prev]);
    return payment;
  }, [patientId]);

  return { payments, isLoading, refresh, addPayment };
}
