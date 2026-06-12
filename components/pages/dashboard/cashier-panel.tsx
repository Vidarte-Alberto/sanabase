"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  ArrowLeftRight,
  Banknote,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  CreditCard,
  Receipt,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/shared/lib/utils";

import { useAppointments } from "./hooks/use-appointments";
import { useConsultations } from "./hooks/use-consultations";
import { usePayments } from "./hooks/use-payments";
import { useShifts } from "./hooks/use-shifts";
import type { Patient } from "./types";
import type { Appointment } from "./types/appointment";
import type { Consultation } from "./types/consultation";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentFormData,
  type PaymentMethod,
} from "./types/payment";
import type { ShiftSummary } from "./types/shift";

const todayStr = () => new Date().toISOString().split("T")[0];

function formatCurrency(amount: number) {
  return amount.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

const QUICK_AMOUNTS = [200, 300, 500, 1000];

const METHOD_ICONS: Record<PaymentMethod, React.ElementType> = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowLeftRight,
};

type SuccessState = {
  patientName: string
  amount: number
  method: PaymentMethod
}

interface CashierPanelProps {
  patients: Patient[]
  defaultPatient?: Patient
}

// ─── Inner form (renders only when patient is selected) ───────────────────────

interface ChargeFormProps {
  patient: Patient
  appointments: Appointment[]
  onClear: () => void
  onSuccess: (state: SuccessState) => void
  onRefreshSummary: () => void
}

function ChargeForm({ patient, appointments, onClear, onSuccess, onRefreshSummary }: ChargeFormProps) {
  const { consultations } = useConsultations(patient.id);
  const { payments } = usePayments(patient.id);

  const [payment, setPayment] = useState<PaymentFormData>({
    appointmentId: null,
    consultationId: null,
    amount: 0,
    concept: "",
    paymentMethod: "cash",
    date: todayStr(),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const didAutoSelect = useRef(false);

  const paidConsultationIds = useMemo(
    () => new Set(payments.map((p) => p.consultationId).filter(Boolean) as string[]),
    [payments],
  );

  const pendingConsultations = useMemo(
    () => consultations
      .filter((c) => !paidConsultationIds.has(c.id))
      .sort((a, b) => b.date.localeCompare(a.date)),
    [consultations, paidConsultationIds],
  );

  useEffect(() => {
    if (didAutoSelect.current || pendingConsultations.length !== 1) return;
    didAutoSelect.current = true;
    const c = pendingConsultations[0];
    setPayment((prev) => ({
      ...prev,
      consultationId: c.id,
      concept: prev.concept || c.reason,
    }));
  }, [pendingConsultations]);

  const todayPatientAppts = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return appointments
      .filter(
        (a) => a.patientId === patient.id &&
          a.status === "scheduled" &&
          new Date(a.dateTime) >= start &&
          new Date(a.dateTime) < end,
      )
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [appointments, patient.id]);

  const updatePayment = <K extends keyof PaymentFormData>(field: K, value: PaymentFormData[K]) => {
    setPayment((prev) => ({ ...prev, [field]: value }));
  };

  const canSubmit = payment.amount > 0 && payment.concept.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/payments?patientId=${patient.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payment),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "No se pudo registrar el pago");
      }

      onSuccess({ patientName: patient.fullName, amount: payment.amount, method: payment.paymentMethod });
      toast.success(`Cobro registrado — ${patient.fullName}`, {
        description: formatCurrency(payment.amount),
      });
      onRefreshSummary();
      onClear();
    } catch (error) {
      toast.error("No se pudo completar el cobro", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectConsultation = (c: Consultation | null) => {
    updatePayment("consultationId", c?.id ?? null);
    if (c && !payment.concept) updatePayment("concept", c.reason);
  };

  const selectAppointment = (appt: Appointment | null) => {
    updatePayment("appointmentId", appt?.id ?? null);
    if (appt && !payment.concept) updatePayment("concept", appt.reason);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Patient chip */}
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <User className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-sm leading-tight">{patient.fullName}</p>
          <p className="text-xs text-muted-foreground">{patient.phone}</p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Pending consultations (created by doctor) */}
      {pendingConsultations.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <ClipboardList className="h-3 w-3" />
            Consultas pendientes de cobro
          </p>
          <div className="space-y-1.5">
            {pendingConsultations.map((c) => (
              <label
                key={c.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-all",
                  payment.consultationId === c.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/30",
                )}
              >
                <input
                  type="radio"
                  name="consult-link"
                  checked={payment.consultationId === c.id}
                  onChange={() => selectConsultation(c)}
                  className="mt-0.5 accent-primary"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">
                    {formatShortDate(c.date)}
                    <span className="ml-2 font-normal text-muted-foreground">{c.reason}</span>
                  </p>
                  {c.diagnosis && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.diagnosis}</p>
                  )}
                </div>
                {payment.consultationId === c.id && (
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    vinculada
                  </span>
                )}
              </label>
            ))}
            {pendingConsultations.length > 0 && (
              <label
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all",
                  payment.consultationId === null
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/30",
                )}
              >
                <input
                  type="radio"
                  name="consult-link"
                  checked={payment.consultationId === null}
                  onChange={() => selectConsultation(null)}
                  className="accent-primary"
                />
                <span className="text-sm text-muted-foreground">Sin vincular a consulta</span>
              </label>
            )}
          </div>
        </div>
      )}

      {/* Today's appointments */}
      {todayPatientAppts.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <CalendarDays className="h-3 w-3" />
            Cita de hoy
          </p>
          <div className="space-y-1.5">
            {todayPatientAppts.map((appt) => (
              <label
                key={appt.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all",
                  payment.appointmentId === appt.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/30",
                )}
              >
                <input
                  type="radio"
                  name="appt-link"
                  checked={payment.appointmentId === appt.id}
                  onChange={() => selectAppointment(appt)}
                  className="accent-primary"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-tight">
                    {formatTime(appt.dateTime)}
                    <span className="ml-2 font-normal text-muted-foreground">{appt.reason}</span>
                  </p>
                </div>
                {payment.appointmentId === appt.id && (
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    → completada
                  </span>
                )}
              </label>
            ))}
            <label
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all",
                payment.appointmentId === null
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/30",
              )}
            >
              <input
                type="radio"
                name="appt-link"
                checked={payment.appointmentId === null}
                onChange={() => selectAppointment(null)}
                className="accent-primary"
              />
              <span className="text-sm text-muted-foreground">Sin vincular a cita</span>
            </label>
          </div>
        </div>
      )}

      <Separator />

      {/* Amount */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Monto *
        </p>
        <div className="flex gap-2">
          {QUICK_AMOUNTS.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => updatePayment("amount", amount)}
              className={cn(
                "flex-1 rounded-lg border py-2 text-sm font-bold transition-all",
                payment.amount === amount
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border bg-background text-foreground hover:border-primary/50 hover:bg-primary/5",
              )}
            >
              ${amount}
            </button>
          ))}
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            $
          </span>
          <Input
            type="number"
            min={0.01}
            step={0.01}
            value={payment.amount || ""}
            onChange={(e) => updatePayment("amount", parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="pl-6"
          />
        </div>
      </div>

      {/* Concept */}
      <div className="space-y-2">
        <Label
          htmlFor="cash-concept"
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
        >
          Concepto *
        </Label>
        <Input
          id="cash-concept"
          value={payment.concept}
          onChange={(e) => updatePayment("concept", e.target.value)}
          placeholder="Consulta general, estudios, etc."
        />
      </div>

      {/* Payment method */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Método de pago *
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PAYMENT_METHODS.map((method) => {
            const Icon = METHOD_ICONS[method];
            const isSelected = payment.paymentMethod === method;
            return (
              <button
                key={method}
                type="button"
                onClick={() => updatePayment("paymentMethod", method)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border py-3.5 text-xs font-semibold transition-all",
                  isSelected
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {PAYMENT_METHOD_LABELS[method]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        size="lg"
        disabled={!canSubmit || isSubmitting}
        className="w-full text-base font-bold"
      >
        {isSubmitting
          ? <Spinner className="mr-2 h-4 w-4" />
          : (() => {
              const Icon = METHOD_ICONS[payment.paymentMethod];
              return <Icon className="mr-2 h-4 w-4" />;
            })()}
        {payment.amount > 0 ? `Cobrar ${formatCurrency(payment.amount)}` : "Cobrar"}
      </Button>
    </form>
  );
}

// ─── Outer shell (patient search + shift header) ──────────────────────────────

export function CashierPanel({ patients, defaultPatient }: CashierPanelProps) {
  const { activeShift, getShiftSummary } = useShifts();
  const { appointments } = useAppointments();
  const [shiftSummary, setShiftSummary] = useState<ShiftSummary | null>(null);

  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(defaultPatient ?? null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const refreshSummary = useCallback(() => {
    if (activeShift) {
      getShiftSummary(activeShift.id).then(setShiftSummary).catch(() => {});
    } else {
      setShiftSummary(null);
    }
  }, [activeShift, getShiftSummary]);

  useEffect(() => {
    refreshSummary();
  }, [refreshSummary]);

  useEffect(() => {
    if (!selectedPatient) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [selectedPatient]);

  const filtered = useMemo(() => {
    if (!search.trim()) return patients.slice(0, 8);
    const q = search.toLowerCase();
    return patients
      .filter(
        (p) => p.fullName.toLowerCase().includes(q) ||
          p.phone.includes(search) ||
          p.email.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [patients, search]);

  const selectPatient = (p: Patient) => {
    setSelectedPatient(p);
    setSearch("");
    setShowDropdown(false);
    setHighlightedIndex(-1);
    setSuccess(null);
  };

  const clearPatient = () => {
    setSelectedPatient(null);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = highlightedIndex >= 0 ? highlightedIndex : 0;
      if (filtered[idx]) selectPatient(filtered[idx]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="h-4 w-4 text-primary" />
              Caja
            </CardTitle>
            {shiftSummary ? (
              <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm leading-none">
                <span className="font-bold text-primary">
                  {formatCurrency(shiftSummary.totalAmount)}
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  {shiftSummary.paymentCount}{" "}
                  {shiftSummary.paymentCount === 1 ? "cobro" : "cobros"}
                </span>
              </div>
            ) : (
              <span className="rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground">
                Sin turno activo
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {success && (
            <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <p className="font-semibold text-sm">Cobro registrado</p>
              </div>
              <p className="mt-1 text-sm text-green-600 dark:text-green-500">
                {success.patientName} · {formatCurrency(success.amount)} ·{" "}
                {PAYMENT_METHOD_LABELS[success.method]}
              </p>
              <button
                type="button"
                onClick={() => setSuccess(null)}
                className="mt-2.5 text-xs font-medium text-green-700 underline-offset-2 hover:underline dark:text-green-400"
              >
                Registrar otro cobro
              </button>
            </div>
          )}

          {selectedPatient ? (
            <ChargeForm
              patient={selectedPatient}
              appointments={appointments}
              onClear={clearPatient}
              onSuccess={setSuccess}
              onRefreshSummary={refreshSummary}
            />
          ) : (
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowDropdown(true);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                placeholder="Buscar paciente por nombre o teléfono..."
                className="file:text-foreground placeholder:text-muted-foreground dark:bg-input/30 border-input h-9 w-full rounded-md border bg-transparent py-1 pl-9 pr-3 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
              {showDropdown && filtered.length > 0 && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                  {filtered.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      onMouseDown={() => selectPatient(p)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        i === highlightedIndex
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted/60",
                        i < filtered.length - 1 && "border-b border-border/40",
                      )}
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{p.fullName}</p>
                        <p className="text-xs text-muted-foreground">{p.phone}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
