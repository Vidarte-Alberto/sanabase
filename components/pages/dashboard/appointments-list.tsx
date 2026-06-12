"use client";

import { useMemo, useState } from "react";

import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Pencil,
  Plus,
  Stethoscope,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import type { AuthSession } from "@/shared/lib/auth-types";
import { cn } from "@/shared/lib/utils";

import { AppointmentForm } from "./appointment-form";
import { useAppointments } from "./hooks/use-appointments";
import type { Patient } from "./types";
import {
  APPOINTMENT_STATUS_LABELS,
  APPOINTMENT_STATUSES,
  type Appointment,
  type AppointmentFormData,
  type AppointmentStatus,
} from "./types/appointment";

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

const STATUS_DOT: Record<AppointmentStatus, string> = {
  scheduled: "bg-blue-500",
  completed: "bg-green-500",
  cancelled: "bg-red-400",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function getRelativeLabel(iso: string) {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffMins = Math.round(diffMs / 60000);
  if (Math.abs(diffMins) < 2) return "ahora";
  if (Math.abs(diffMins) < 60) return diffMins > 0 ? `en ${diffMins}m` : `hace ${-diffMins}m`;
  const diffHours = Math.round(diffMins / 60);
  if (Math.abs(diffHours) < 24) return diffHours > 0 ? `en ${diffHours}h` : `hace ${-diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  return diffDays > 0 ? `en ${diffDays}d` : `hace ${-diffDays}d`;
}

// ─── AppointmentCard ───────────────────────────────────────────────────────

interface AppointmentCardProps {
  appt: Appointment
  patientName: string
  isToday: boolean
  canDelete: boolean
  onEdit: (a: Appointment) => void
  onDelete: (a: Appointment) => void
  onStatusChange: (a: Appointment, status: AppointmentStatus) => Promise<void>
  onAttend?: () => void
}

function AppointmentCard({
  appt,
  patientName,
  isToday,
  canDelete,
  onEdit,
  onDelete,
  onStatusChange,
  onAttend,
}: AppointmentCardProps) {
  const [changingStatus, setChangingStatus] = useState(false);

  const quickStatus = async (status: AppointmentStatus) => {
    setChangingStatus(true);
    try {
      await onStatusChange(appt, status);
    } finally {
      setChangingStatus(false);
    }
  };

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors",
        appt.status === "cancelled"
          ? "border-border/40 bg-muted/20 opacity-60"
          : "border-border/50 bg-card hover:bg-muted/20",
      )}
    >
      {/* Status dot */}
      <span
        className={cn(
          "mt-0.5 h-2 w-2 shrink-0 self-start rounded-full",
          STATUS_DOT[appt.status],
        )}
      />

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="font-semibold text-sm leading-tight">{patientName}</span>
          <span className="text-xs text-muted-foreground">
            {isToday ? formatTime(appt.dateTime) : formatShortDate(appt.dateTime)}
            {" · "}
            <span className="text-muted-foreground/60">{getRelativeLabel(appt.dateTime)}</span>
          </span>
        </div>
        <p className="truncate text-sm text-muted-foreground leading-tight">{appt.reason}</p>
        {appt.notes && (
          <p className="truncate text-xs text-muted-foreground/60 leading-tight">{appt.notes}</p>
        )}
      </div>

      {/* Actions (always visible on mobile, hover on desktop) */}
      <div className="flex shrink-0 items-center gap-0.5">
        <Badge
          variant="secondary"
          className={cn(
            "hidden shrink-0 border-0 text-xs sm:inline-flex",
            STATUS_COLORS[appt.status],
          )}
        >
          {APPOINTMENT_STATUS_LABELS[appt.status]}
        </Badge>

        {changingStatus ? (
          <Spinner className="mx-2 h-3.5 w-3.5" />
        ) : (
          <>
            {appt.status === "scheduled" && onAttend && (
              <button
                type="button"
                onClick={onAttend}
                title="Atender"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-primary/10 hover:text-primary sm:opacity-100"
              >
                <Stethoscope className="h-3.5 w-3.5" />
              </button>
            )}
            {appt.status !== "completed" && (
              <button
                type="button"
                onClick={() => quickStatus("completed")}
                title="Completar"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/30 dark:hover:text-green-400 sm:opacity-100"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            )}
            {appt.status === "scheduled" && (
              <button
                type="button"
                onClick={() => quickStatus("cancelled")}
                title="Cancelar"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400 sm:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </>
        )}

        <button
          type="button"
          onClick={() => onEdit(appt)}
          title="Editar"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-muted hover:text-foreground sm:opacity-100"
        >
          <Pencil className="h-3 w-3" />
        </button>

        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete(appt)}
            title="Eliminar"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-red-100 hover:text-destructive sm:opacity-100"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Collapsible Section ───────────────────────────────────────────────────

interface SectionProps {
  label: string
  count: number
  defaultOpen?: boolean
  accent?: boolean
  children: React.ReactNode
}

function Section({ label, count, defaultOpen = true, accent = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-2">
          {accent && <Clock className="h-3 w-3 text-primary" />}
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-widest",
              accent ? "text-primary" : "text-muted-foreground",
            )}
          >
            {label}
          </span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {count}
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
      </button>
      {open && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

interface AppointmentsListProps {
  patients: Patient[]
  session: AuthSession
  onAttend?: (appt: Appointment) => void
}

export function AppointmentsList({ patients, session, onAttend }: AppointmentsListProps) {
  const { appointments, isLoading, addAppointment, updateAppointment, deleteAppointment } =
    useAppointments();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "all">("all");
  const [selectedPatientId, setSelectedPatientId] = useState<string>("all");
  const [newPatientId, setNewPatientId] = useState<string>("");

  const patientMap = useMemo(
    () => new Map(patients.map((p) => [p.id, p.fullName])),
    [patients],
  );

  const filtered = useMemo(() => {
    let list = appointments;
    if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter);
    if (selectedPatientId !== "all") list = list.filter((a) => a.patientId === selectedPatientId);
    return list;
  }, [appointments, statusFilter, selectedPatientId]);

  const { todayAppts, upcomingAppts, pastAppts } = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    return {
      todayAppts: filtered
        .filter((a) => {
          const d = new Date(a.dateTime);
          return d >= todayStart && d < tomorrowStart;
        })
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
      upcomingAppts: filtered
        .filter((a) => new Date(a.dateTime) >= tomorrowStart)
        .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()),
      pastAppts: filtered
        .filter((a) => new Date(a.dateTime) < todayStart)
        .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()),
    };
  }, [filtered]);

  const handleStatusChange = async (appt: Appointment, status: AppointmentStatus) => {
    try {
      await updateAppointment(appt.id, {
        dateTime: appt.dateTime,
        reason: appt.reason,
        status,
        notes: appt.notes,
      });
      toast.success(APPOINTMENT_STATUS_LABELS[status]);
    } catch (error) {
      toast.error("No se pudo actualizar", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    }
  };

  const handleSubmit = async (data: AppointmentFormData) => {
    const patientId = editing ? editing.patientId : newPatientId;
    if (!editing && !patientId) {
      toast.error("Selecciona un paciente");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editing) {
        await updateAppointment(editing.id, data);
        toast.success("Cita actualizada");
      } else {
        await addAppointment(patientId, data);
        toast.success("Cita agendada");
      }

      setShowForm(false);
      setEditing(null);
      setNewPatientId("");
    } catch (error) {
      toast.error("No se pudo guardar la cita", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (a: Appointment) => {
    setEditing(a);
    setShowForm(true);
  };

  const handleDelete = async (a: Appointment) => {
    try {
      await deleteAppointment(a.id);
      toast.success("Cita eliminada");
    } catch (error) {
      toast.error("No se pudo eliminar la cita", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    }
  };

  const canDelete = (a: Appointment) => session.role === "admin" || a.userId === session.userId;

  const hasFilters = statusFilter !== "all" || selectedPatientId !== "all";
  const isEmpty = filtered.length === 0;

  return (
    <div className="space-y-3">
      <Card className="border-border/50">
        {/* ── Header ── */}
        <CardHeader className="border-b border-border/50 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              Citas
            </CardTitle>
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                setEditing(null);
                setNewPatientId("");
                setShowForm(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva Cita
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 pt-1">
            <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
              <SelectTrigger className="h-8 flex-1 text-xs">
                <User className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue placeholder="Todos los pacientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los pacientes</SelectItem>
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as AppointmentStatus | "all")}
            >
              <SelectTrigger className="h-8 w-36 text-xs">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {APPOINTMENT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {APPOINTMENT_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* ── Inline form ── */}
          {showForm && (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              {!editing && (
                <div className="mb-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Paciente *
                  </label>
                  <Select value={newPatientId} onValueChange={setNewPatientId}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecciona un paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {editing && (
                <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">
                    {patientMap.get(editing.patientId) ?? "Paciente"}
                  </span>
                </div>
              )}

              <AppointmentForm
                initial={
                  editing
                    ? {
                        dateTime: editing.dateTime,
                        reason: editing.reason,
                        status: editing.status,
                        notes: editing.notes,
                      }
                    : undefined
                }
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditing(null);
                  setNewPatientId("");
                }}
                isLoading={isSubmitting}
              />
            </div>
          )}

          {/* ── Content ── */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner className="h-5 w-5" />
            </div>
          ) : isEmpty ? (
            <Empty className="py-8">
              <EmptyContent>
                <EmptyTitle>Sin citas</EmptyTitle>
                <EmptyDescription>
                  {hasFilters
                    ? "No hay citas que coincidan con los filtros."
                    : "Agenda la primera cita para un paciente."}
                </EmptyDescription>
                {!hasFilters && (
                  <div className="flex justify-center">
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditing(null);
                        setNewPatientId("");
                        setShowForm(true);
                      }}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Nueva Cita
                    </Button>
                  </div>
                )}
              </EmptyContent>
            </Empty>
          ) : (
            <div className="space-y-4">
              {todayAppts.length > 0 && (
                <Section label="Hoy" count={todayAppts.length} defaultOpen accent>
                  {todayAppts.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      patientName={patientMap.get(appt.patientId) ?? "Desconocido"}
                      isToday
                      canDelete={canDelete(appt)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                      onAttend={onAttend ? () => onAttend(appt) : undefined}
                    />
                  ))}
                </Section>
              )}

              {upcomingAppts.length > 0 && (
                <Section label="Próximas" count={upcomingAppts.length} defaultOpen>
                  {upcomingAppts.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      patientName={patientMap.get(appt.patientId) ?? "Desconocido"}
                      isToday={false}
                      canDelete={canDelete(appt)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                      onAttend={onAttend ? () => onAttend(appt) : undefined}
                    />
                  ))}
                </Section>
              )}

              {pastAppts.length > 0 && (
                <Section label="Anteriores" count={pastAppts.length} defaultOpen={false}>
                  {pastAppts.map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appt={appt}
                      patientName={patientMap.get(appt.patientId) ?? "Desconocido"}
                      isToday={false}
                      canDelete={canDelete(appt)}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                      onAttend={onAttend ? () => onAttend(appt) : undefined}
                    />
                  ))}
                </Section>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
