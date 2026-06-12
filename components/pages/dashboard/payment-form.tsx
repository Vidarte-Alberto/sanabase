"use client";

import { useState } from "react";

import { CreditCard, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

import { PAYMENT_METHOD_LABELS, PAYMENT_METHODS, type PaymentFormData, type PaymentMethod } from "./types/payment";

interface PaymentFormProps {
  onSubmit: (data: PaymentFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const today = () => new Date().toISOString().split("T")[0];

export function PaymentForm({ onSubmit, onCancel, isLoading }: PaymentFormProps) {
  const [formData, setFormData] = useState<PaymentFormData>({
    appointmentId: null,
    consultationId: null,
    amount: 0,
    concept: "",
    paymentMethod: "cash",
    date: today(),
  });

  const update = <K extends keyof PaymentFormData>(field: K, value: PaymentFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <CreditCard className="h-4 w-4 text-primary" />
          Registrar Pago
        </p>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="pay-amount">Monto *</Label>
          <Input
            id="pay-amount"
            type="number"
            min={0.01}
            step={0.01}
            value={formData.amount || ""}
            onChange={(e) => update("amount", parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            required
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="pay-date">Fecha *</Label>
          <Input
            id="pay-date"
            type="date"
            value={formData.date}
            onChange={(e) => update("date", e.target.value)}
            required
            className="mt-1.5"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="pay-concept">Concepto *</Label>
          <Input
            id="pay-concept"
            value={formData.concept}
            onChange={(e) => update("concept", e.target.value)}
            placeholder="Consulta general, estudios, etc."
            required
            className="mt-1.5"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="pay-method">Método de Pago *</Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(v) => update("paymentMethod", v as PaymentMethod)}
          >
            <SelectTrigger className="mt-1.5">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading && <Spinner className="mr-2 h-4 w-4" />}
          Registrar Pago
        </Button>
      </div>
    </form>
  );
}
