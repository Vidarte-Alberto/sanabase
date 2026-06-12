"use client";

import { useEffect, useState } from "react";

import { Stethoscope, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

import type { Consultation, ConsultationFormData } from "./types/consultation";

interface ConsultationFormProps {
  consultation?: Consultation
  onSubmit: (data: ConsultationFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const today = () => new Date().toISOString().split("T")[0];

const initialData: ConsultationFormData = {
  date: today(),
  reason: "",
  diagnosis: "",
  treatment: "",
  notes: "",
};

export function ConsultationForm({ consultation, onSubmit, onCancel, isLoading }: ConsultationFormProps) {
  const [formData, setFormData] = useState<ConsultationFormData>(initialData);
  const isEditing = !!consultation;

  useEffect(() => {
    if (consultation) {
      setFormData({
        date: consultation.date,
        reason: consultation.reason,
        diagnosis: consultation.diagnosis,
        treatment: consultation.treatment,
        notes: consultation.notes,
      });
      return;
    }

    setFormData({ ...initialData, date: today() });
  }, [consultation]);

  const update = <K extends keyof ConsultationFormData>(field: K, value: ConsultationFormData[K]) => {
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
          <Stethoscope className="h-4 w-4 text-primary" />
          {isEditing ? "Editar Consulta" : "Nueva Consulta"}
        </p>
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label htmlFor="cons-date">Fecha *</Label>
          <Input
            id="cons-date"
            type="date"
            value={formData.date}
            onChange={(e) => update("date", e.target.value)}
            required
            className="mt-1.5"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="cons-reason">Motivo de Consulta *</Label>
          <Input
            id="cons-reason"
            value={formData.reason}
            onChange={(e) => update("reason", e.target.value)}
            placeholder="¿Por qué acude el paciente?"
            required
            className="mt-1.5"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="cons-diagnosis">Diagnóstico</Label>
          <Textarea
            id="cons-diagnosis"
            value={formData.diagnosis}
            onChange={(e) => update("diagnosis", e.target.value)}
            placeholder="Diagnóstico médico..."
            rows={2}
            className="mt-1.5"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="cons-treatment">Tratamiento</Label>
          <Textarea
            id="cons-treatment"
            value={formData.treatment}
            onChange={(e) => update("treatment", e.target.value)}
            placeholder="Indicaciones y medicamentos..."
            rows={2}
            className="mt-1.5"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="cons-notes">Observaciones</Label>
          <Textarea
            id="cons-notes"
            value={formData.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="Notas adicionales..."
            rows={2}
            className="mt-1.5"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading && <Spinner className="mr-2 h-4 w-4" />}
          {isEditing ? "Guardar Cambios" : "Registrar Consulta"}
        </Button>
      </div>
    </form>
  );
}
