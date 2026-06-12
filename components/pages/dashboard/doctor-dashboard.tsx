"use client";

import { useCallback, useMemo, useState } from "react";

import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Check,
  Clock,
  Droplet,
  Phone,
  Shield,
  Stethoscope,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { AuthSession } from "@/shared/lib/auth-types";
import { cn } from "@/shared/lib/utils";

import { AdminAnalytics } from "./admin-analytics";
import { AppointmentsList } from "./appointments-list";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { useAppointments } from "./hooks/use-appointments";
import { usePatients } from "./hooks/use-patients";
import { PatientCard } from "./patient-card";
import { PatientDetail } from "./patient-detail";
import { PatientForm } from "./patient-form";
import { SearchBar } from "./search-bar";
import { ShiftPanel } from "./shift-panel";
import { GENDER_LABELS, type Patient, type PatientFormData } from "./types";
import {
  APPOINTMENT_STATUS_LABELS,
  type Appointment,
  type AppointmentFormData,
  type AppointmentStatus,
} from "./types/appointment";
import type { ConsultationFormData } from "./types/consultation";
import { UsersManagement } from "./users-management";

type Mode = "citas" | "pacientes" | "analytics" | "usuarios" | "turno"
type PatientView = "list" | "detail" | "form"
type AttendingState = { appointment: Appointment; patient: Patient }

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  if (d >= todayStart && d < tomorrowStart) {
    return `Hoy · ${formatTime(iso)}`;
  }
  return `${d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })} · ${formatTime(iso)}`;
}

const todayStr = () => new Date().toISOString().split("T")[0];

// ─── Consultation Workspace ────────────────────────────────────────────────────

interface ConsultationWorkspaceProps {
  attending: AttendingState
  updateAppointment: (id: string, data: AppointmentFormData) => Promise<Appointment>
  onDone: () => void
}

function ConsultationWorkspace({ attending, updateAppointment, onDone }: ConsultationWorkspaceProps) {
  const { appointment, patient } = attending;

  const [form, setForm] = useState<ConsultationFormData>({
    date: todayStr(),
    reason: appointment.reason,
    diagnosis: "",
    treatment: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = <K extends keyof ConsultationFormData>(k: K, v: ConsultationFormData[K]) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason.trim()) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/consultations?patientId=${patient.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "No se pudo registrar la consulta");
      }

      await updateAppointment(appointment.id, {
        dateTime: appointment.dateTime,
        reason: appointment.reason,
        status: "completed",
        notes: appointment.notes,
      });

      toast.success("Consulta registrada", {
        description: `${patient.fullName} está listo para pasar a caja`,
      });

      onDone();
    } catch (err) {
      toast.error("No se pudo registrar la consulta", {
        description: err instanceof Error ? err.message : "Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Back */}
      <button
        type="button"
        onClick={onDone}
        className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Volver a citas
      </button>

      {/* Patient info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                <h3 className="text-base font-bold leading-tight">{patient.fullName}</h3>
                <span className="text-sm text-muted-foreground">
                  {patient.age} años · {GENDER_LABELS[patient.gender as keyof typeof GENDER_LABELS] ?? patient.gender}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  {patient.phone}
                </span>
                {patient.bloodType && (
                  <span className="flex items-center gap-1 text-xs">
                    <Droplet className="h-3 w-3 text-red-500" />
                    {patient.bloodType}
                  </span>
                )}
              </div>
              {patient.allergies && (
                <div className="flex items-start gap-1.5 rounded-lg bg-orange-50 px-2.5 py-1.5 text-xs text-orange-700 dark:bg-orange-900/20 dark:text-orange-400">
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>
                    <span className="font-semibold">Alergias: </span>
                    {patient.allergies}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointment ref */}
      <div className="flex items-center gap-2 rounded-xl bg-muted/40 px-4 py-2.5 text-sm">
        <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
        <span className="font-medium text-muted-foreground">Cita:</span>
        <span className="font-semibold">{formatDateTime(appointment.dateTime)}</span>
        <span className="text-muted-foreground">·</span>
        <span className="truncate text-muted-foreground">{appointment.reason}</span>
      </div>

      <Separator />

      {/* Consultation form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <Stethoscope className="h-3 w-3" />
          Nota clínica
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label
              htmlFor="doc-date"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Fecha
            </Label>
            <Input
              id="doc-date"
              type="date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div className="sm:col-span-2">
            <Label
              htmlFor="doc-reason"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Motivo de consulta *
            </Label>
            <Input
              id="doc-reason"
              value={form.reason}
              onChange={(e) => update("reason", e.target.value)}
              placeholder="¿Por qué acude el paciente?"
              required
              className="mt-1.5"
            />
          </div>

          <div className="sm:col-span-2">
            <Label
              htmlFor="doc-diagnosis"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Diagnóstico
            </Label>
            <Textarea
              id="doc-diagnosis"
              value={form.diagnosis}
              onChange={(e) => update("diagnosis", e.target.value)}
              placeholder="Diagnóstico clínico..."
              rows={3}
              className="mt-1.5 resize-none"
            />
          </div>

          <div className="sm:col-span-2">
            <Label
              htmlFor="doc-treatment"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Tratamiento / Indicaciones
            </Label>
            <Textarea
              id="doc-treatment"
              value={form.treatment}
              onChange={(e) => update("treatment", e.target.value)}
              placeholder="Medicamentos, dosis, indicaciones..."
              rows={3}
              className="mt-1.5 resize-none"
            />
          </div>

          <div className="sm:col-span-2">
            <Label
              htmlFor="doc-notes"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Notas adicionales
            </Label>
            <Textarea
              id="doc-notes"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Observaciones, próxima revisión..."
              rows={2}
              className="mt-1.5 resize-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Button
            type="submit"
            size="lg"
            disabled={!form.reason.trim() || isSubmitting}
            className="w-full text-base font-bold"
          >
            {isSubmitting ? (
              <Spinner className="mr-2 h-4 w-4" />
            ) : (
              <Stethoscope className="mr-2 h-4 w-4" />
            )}
            Registrar Consulta
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            La cita quedará completada y el paciente podrá ir a caja
          </p>
        </div>
      </form>
    </div>
  );
}

// ─── Doctor Sidebar ────────────────────────────────────────────────────────────

interface DoctorSidebarProps {
  appointments: Appointment[]
  patients: Patient[]
  attendingApptId: string | null
  onAttend: (appt: Appointment) => void
  onUpdateAppointment: (id: string, data: AppointmentFormData) => Promise<Appointment>
}

function DoctorSidebar({
  appointments,
  patients,
  attendingApptId,
  onAttend,
  onUpdateAppointment,
}: DoctorSidebarProps) {
  const patientMap = useMemo(
    () => new Map(patients.map((p) => [p.id, p])),
    [patients],
  );

  const todayAppts = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    return appointments
      .filter((a) => {
        const d = new Date(a.dateTime);
        return d >= todayStart && d < tomorrowStart;
      })
      .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [appointments]);

  const scheduledToday = todayAppts.filter((a) => a.status === "scheduled");
  const attendedToday = todayAppts.filter((a) => a.status === "completed");

  const handleQuickStatus = async (appt: Appointment, status: AppointmentStatus) => {
    try {
      await onUpdateAppointment(appt.id, {
        dateTime: appt.dateTime,
        reason: appt.reason,
        status,
        notes: appt.notes,
      });
      toast.success(APPOINTMENT_STATUS_LABELS[status]);
    } catch {
      toast.error("No se pudo actualizar");
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/20 px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Agenda de Hoy
          </span>
          {scheduledToday.length > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {scheduledToday.length}
            </span>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {new Date().toLocaleDateString("es-MX", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>

      {/* Appointments */}
      <div className="flex-1 overflow-y-auto">
        {todayAppts.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <CalendarDays className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-xs text-muted-foreground">Sin citas para hoy</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {todayAppts.map((appt) => {
              const patient = patientMap.get(appt.patientId);
              const isAttending = appt.id === attendingApptId;
              const isPast = new Date(appt.dateTime) < new Date();
              const statusDot =
                appt.status === "completed"
                  ? "bg-green-500"
                  : appt.status === "cancelled"
                    ? "bg-red-400"
                    : isPast
                      ? "bg-orange-400"
                      : "bg-blue-500";

              return (
                <div
                  key={appt.id}
                  className={cn(
                    "group flex items-start gap-2 px-3 py-2.5 transition-colors",
                    isAttending
                      ? "bg-primary/10"
                      : appt.status === "cancelled"
                        ? "opacity-40"
                        : "hover:bg-muted/30",
                  )}
                >
                  <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", statusDot)} />
                    <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                      {formatTime(appt.dateTime)}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-xs font-semibold leading-tight",
                        isAttending && "text-primary",
                      )}
                    >
                      {patient?.fullName ?? "Desconocido"}
                    </p>
                    <p className="truncate text-[10px] leading-tight text-muted-foreground">
                      {appt.reason}
                    </p>
                    {appt.status === "completed" && (
                      <span className="mt-0.5 inline-flex items-center gap-0.5 text-[9px] font-semibold text-green-600 dark:text-green-400">
                        <Check className="h-2.5 w-2.5" /> Atendido
                      </span>
                    )}
                  </div>

                  {appt.status === "scheduled" && (
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => patient && onAttend(appt)}
                        title="Atender"
                        disabled={!patient}
                        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Stethoscope className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickStatus(appt, "cancelled")}
                        title="Cancelar"
                        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer summary */}
      {attendedToday.length > 0 && (
        <div className="shrink-0 border-t px-3 py-2 text-center">
          <span className="text-[10px] text-muted-foreground">
            {attendedToday.length}{" "}
            {attendedToday.length === 1 ? "paciente atendido" : "pacientes atendidos"} hoy
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV = [
  { id: "citas" as const, icon: Stethoscope, label: "Citas" },
  { id: "pacientes" as const, icon: Users, label: "Pacientes" },
  { id: "analytics" as const, icon: BarChart3, label: "Análisis" },
  { id: "usuarios" as const, icon: Shield, label: "Usuarios" },
  { id: "turno" as const, icon: Clock, label: "Turno" },
];

// ─── DoctorDashboard ──────────────────────────────────────────────────────────

interface DoctorDashboardProps {
  session: AuthSession
}

export function DoctorDashboard({ session }: DoctorDashboardProps) {
  const { appointments, updateAppointment } = useAppointments();
  const {
    patients,
    isLoading: patientsLoading,
    addPatient,
    updatePatient,
    deletePatient,
  } = usePatients();

  const [mode, setMode] = useState<Mode>("citas");
  const [attending, setAttending] = useState<AttendingState | null>(null);
  const [listKey, setListKey] = useState(0);

  const [patientView, setPatientView] = useState<PatientView>("list");
  const [focusedPatient, setFocusedPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [isPatientSubmitting, setIsPatientSubmitting] = useState(false);

  const patientMap = useMemo(
    () => new Map(patients.map((p) => [p.id, p])),
    [patients],
  );

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter(
      (p) => p.fullName.toLowerCase().includes(q) ||
        p.phone.includes(patientSearch) ||
        p.email.toLowerCase().includes(q),
    );
  }, [patients, patientSearch]);

  const handleAttend = useCallback(
    (appt: Appointment) => {
      const patient = patientMap.get(appt.patientId);
      if (!patient) return;
      setAttending({ appointment: appt, patient });
      setMode("citas");
    },
    [patientMap],
  );

  const handleDone = useCallback(() => {
    setAttending(null);
    setListKey((k) => k + 1);
  }, []);

  const handleSavePatient = async (data: PatientFormData) => {
    setIsPatientSubmitting(true);
    try {
      if (focusedPatient) {
        await updatePatient(focusedPatient.id, data);
        toast.success("Paciente actualizado");
      } else {
        await addPatient(data);
        toast.success("Paciente registrado");
      }
      setPatientView("list");
      setFocusedPatient(null);
    } catch (err) {
      toast.error("No se pudo guardar el paciente", {
        description: err instanceof Error ? err.message : "Intenta nuevamente.",
      });
    } finally {
      setIsPatientSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!patientToDelete) return;
    try {
      await deletePatient(patientToDelete.id);
      toast.success("Paciente eliminado");
      setPatientToDelete(null);
      if (focusedPatient?.id === patientToDelete.id) {
        setPatientView("list");
        setFocusedPatient(null);
      }
    } catch (err) {
      toast.error("No se pudo eliminar el paciente", {
        description: err instanceof Error ? err.message : "Intenta nuevamente.",
      });
    }
  };

  return (
    <div className="flex overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
      {/* ── Left nav ── */}
      <nav className="flex w-18 shrink-0 flex-col border-r border-border bg-card">
        {NAV.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setMode(id);
              if (id !== "citas") setAttending(null);
            }}
            className={cn(
              "flex w-full flex-col items-center gap-1.5 py-5 text-[9px] font-bold uppercase tracking-widest transition-colors",
              mode === id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </button>
        ))}
      </nav>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-4 md:p-6">

          {mode === "citas" && (
            attending ? (
              <ConsultationWorkspace
                attending={attending}
                updateAppointment={updateAppointment}
                onDone={handleDone}
              />
            ) : (
              <AppointmentsList
                key={listKey}
                patients={patients}
                session={session}
                onAttend={handleAttend}
              />
            )
          )}

          {mode === "pacientes" && (
            <div className="mx-auto max-w-3xl space-y-4">
              {patientView === "list" && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <SearchBar
                        value={patientSearch}
                        onChange={setPatientSearch}
                        placeholder="Buscar por nombre, correo o teléfono..."
                      />
                    </div>
                    <Button
                      onClick={() => {
                        setFocusedPatient(null);
                        setPatientView("form");
                      }}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Nuevo
                    </Button>
                  </div>

                  {patientsLoading ? (
                    <div className="flex justify-center py-12">
                      <Spinner className="h-6 w-6" />
                    </div>
                  ) : filteredPatients.length === 0 ? (
                    <Empty className="py-12">
                      <EmptyContent>
                        {patientSearch ? (
                          <>
                            <EmptyTitle>Sin resultados</EmptyTitle>
                            <EmptyDescription>
                              No hay pacientes que coincidan con &quot;{patientSearch}&quot;
                            </EmptyDescription>
                            <div className="flex justify-center">
                              <Button variant="outline" onClick={() => setPatientSearch("")}>
                                Limpiar búsqueda
                              </Button>
                            </div>
                          </>
                        ) : (
                          <>
                            <EmptyTitle>Sin pacientes</EmptyTitle>
                            <EmptyDescription>Registra el primer paciente.</EmptyDescription>
                          </>
                        )}
                      </EmptyContent>
                    </Empty>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {filteredPatients.map((p) => (
                        <PatientCard
                          key={p.id}
                          patient={p}
                          onView={(pt) => { setFocusedPatient(pt); setPatientView("detail"); }}
                          onEdit={(pt) => { setFocusedPatient(pt); setPatientView("form"); }}
                          onDelete={(pt) => setPatientToDelete(pt)}
                        />
                      ))}
                    </div>
                  )}

                  <DeleteConfirmDialog
                    patient={patientToDelete}
                    open={!!patientToDelete}
                    onOpenChange={(open) => !open && setPatientToDelete(null)}
                    onConfirm={handleConfirmDelete}
                  />
                </>
              )}

              {patientView === "detail" && focusedPatient && (
                <>
                  <PatientDetail
                    patient={focusedPatient}
                    session={session}
                    onClose={() => setPatientView("list")}
                    onEdit={(pt) => { setFocusedPatient(pt); setPatientView("form"); }}
                    onDelete={(pt) => setPatientToDelete(pt)}
                  />
                  <DeleteConfirmDialog
                    patient={patientToDelete}
                    open={!!patientToDelete}
                    onOpenChange={(open) => !open && setPatientToDelete(null)}
                    onConfirm={handleConfirmDelete}
                  />
                </>
              )}

              {patientView === "form" && (
                <PatientForm
                  patient={focusedPatient ?? undefined}
                  onSubmit={handleSavePatient}
                  onCancel={() => setPatientView(focusedPatient ? "detail" : "list")}
                  isLoading={isPatientSubmitting}
                />
              )}
            </div>
          )}

          {mode === "analytics" && <AdminAnalytics />}

          {mode === "usuarios" && <UsersManagement session={session} />}

          {mode === "turno" && (
            <div className="mx-auto max-w-xl">
              <ShiftPanel />
            </div>
          )}
        </div>
      </main>

      {/* ── Right sidebar ── */}
      <aside className="hidden w-[260px] shrink-0 overflow-hidden border-l border-border bg-muted/10 lg:flex lg:flex-col">
        <DoctorSidebar
          appointments={appointments}
          patients={patients}
          attendingApptId={attending?.appointment.id ?? null}
          onAttend={handleAttend}
          onUpdateAppointment={updateAppointment}
        />
      </aside>

    </div>
  );
}
