"use client";

import { useState } from "react";

import { CalendarDays } from "lucide-react";

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
import { Textarea } from "@/components/ui/textarea";

import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_STATUS_LABELS,
  type AppointmentFormData,
  type AppointmentStatus,
} from "./types/appointment";

interface AppointmentFieldsProps {
  value: AppointmentFormData
  onChange: (data: AppointmentFormData) => void
}

export function AppointmentFields({ value, onChange }: AppointmentFieldsProps) {
  const update = <K extends keyof AppointmentFormData>(field: K, val: AppointmentFormData[K]) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="appt-datetime">Fecha y Hora *</Label>
        <Input
          id="appt-datetime"
          type="datetime-local"
          value={value.dateTime}
          onChange={(e) => update("dateTime", e.target.value)}
          required
          className="mt-1.5"
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="appt-reason">Motivo *</Label>
        <Input
          id="appt-reason"
          value={value.reason}
          onChange={(e) => update("reason", e.target.value)}
          placeholder="Motivo de la cita"
          required
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="appt-status">Estado</Label>
        <Select
          value={value.status}
          onValueChange={(v) => update("status", v as AppointmentStatus)}
        >
          <SelectTrigger className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {APPOINTMENT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {APPOINTMENT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="appt-notes">Notas</Label>
        <Textarea
          id="appt-notes"
          value={value.notes}
          onChange={(e) => update("notes", e.target.value)}
          placeholder="Observaciones adicionales..."
          rows={2}
          className="mt-1.5"
        />
      </div>
    </div>
  );
}

interface AppointmentFormProps {
  initial?: AppointmentFormData
  onSubmit: (data: AppointmentFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const defaultData = (): AppointmentFormData => ({
  dateTime: "",
  reason: "",
  status: "scheduled",
  notes: "",
});

export function AppointmentForm({ initial, onSubmit, onCancel, isLoading }: AppointmentFormProps) {
  const [formData, setFormData] = useState<AppointmentFormData>(initial ?? defaultData());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <CalendarDays className="h-4 w-4 text-primary" />
        {initial ? "Editar Cita" : "Nueva Cita"}
      </p>

      <AppointmentFields value={formData} onChange={setFormData} />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading && <Spinner className="mr-2 h-4 w-4" />}
          {initial ? "Guardar Cambios" : "Agendar Cita"}
        </Button>
      </div>
    </form>
  );
}
