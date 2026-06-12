"use client";

import { useEffect, useMemo, useState } from "react";

import {
  ArrowLeftRight,
  Banknote,
  CalendarDays,
  Check,
  Clock,
  CreditCard,
  Play,
  Receipt,
  Square,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import type { AuthSession } from "@/shared/lib/auth-types";
import { cn } from "@/shared/lib/utils";

import { AppointmentsList } from "./appointments-list";
import { CashierPanel } from "./cashier-panel";
import { useAppointments } from "./hooks/use-appointments";
import { usePatients } from "./hooks/use-patients";
import { useShifts } from "./hooks/use-shifts";
import { PatientCard } from "./patient-card";
import { PatientDetail } from "./patient-detail";
import { PatientForm } from "./patient-form";
import { SearchBar } from "./search-bar";
import { ShiftPanel } from "./shift-panel";
import type { Patient, PatientFormData } from "./types";
import { APPOINTMENT_STATUS_LABELS, type Appointment, type AppointmentStatus } from "./types/appointment";
import type { ShiftSummary } from "./types/shift";

type Mode = "cobro" | "citas" | "pacientes" | "turno"
type PatientView = "list" | "detail" | "form"

function formatCurrency(n: number) {
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(startIso: string) {
  const mins = Math.floor((Date.now() - new Date(startIso).getTime()) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Today's sidebar ──────────────────────────────────────────────────────────

interface TodaySidebarProps {
  patients: Patient[]
  onChargePatient: (patient: Patient) => void
}

function TodaySidebar({ patients, onChargePatient }: TodaySidebarProps) {
  const { activeShift, isLoading: shiftLoading, startShift, closeShift, getShiftSummary } =
    useShifts();
  const { appointments, updateAppointment } = useAppointments();
  const [shiftSummary, setShiftSummary] = useState<ShiftSummary | null>(null);
  const [shiftActionLoading, setShiftActionLoading] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!activeShift) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, [activeShift]);

  useEffect(() => {
    if (!activeShift) {
      setShiftSummary(null);
      return;
    }
    getShiftSummary(activeShift.id).then(setShiftSummary).catch(() => {});
  }, [activeShift, getShiftSummary]);

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

  const handleQuickStatus = async (appt: Appointment, status: AppointmentStatus) => {
    try {
      await updateAppointment(appt.id, {
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

  const handleStartShift = async () => {
    setShiftActionLoading(true);
    try {
      await startShift();
      toast.success("Turno iniciado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al iniciar turno");
    } finally {
      setShiftActionLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!activeShift) return;
    setShiftActionLoading(true);
    try {
      await closeShift(activeShift.id);
      toast.success("Turno cerrado", {
        description: shiftSummary
          ? `Total: ${formatCurrency(shiftSummary.totalAmount)}`
          : undefined,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cerrar turno");
    } finally {
      setShiftActionLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* ── Shift status ── */}
      <div className={cn("shrink-0 border-b p-3", activeShift ? "bg-primary/5" : "bg-muted/20")}>
        {shiftLoading ? (
          <div className="flex justify-center py-3">
            <Spinner className="h-4 w-4" />
          </div>
        ) : activeShift ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
                <span className="text-xs font-bold text-green-700 dark:text-green-400">
                  Turno activo
                </span>
              </div>
              <span className="text-xs tabular-nums text-muted-foreground">
                {formatDuration(activeShift.startTime)}
              </span>
            </div>

            {shiftSummary && (
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Banknote className="h-3 w-3 text-green-600" />
                  {formatCurrency(shiftSummary.byMethod.cash)}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <CreditCard className="h-3 w-3 text-blue-600" />
                  {formatCurrency(shiftSummary.byMethod.card)}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ArrowLeftRight className="h-3 w-3 text-purple-600" />
                  {formatCurrency(shiftSummary.byMethod.transfer)}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-primary">
                {shiftSummary ? formatCurrency(shiftSummary.totalAmount) : "—"}
              </span>
              <span className="text-xs text-muted-foreground">
                {shiftSummary?.paymentCount ?? 0}{" "}
                {shiftSummary?.paymentCount === 1 ? "cobro" : "cobros"}
              </span>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="h-7 w-full text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={handleCloseShift}
              disabled={shiftActionLoading}
            >
              {shiftActionLoading ? (
                <Spinner className="mr-1 h-3 w-3" />
              ) : (
                <Square className="mr-1 h-3 w-3" />
              )}
              Cerrar Turno
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Sin turno activo</p>
            <Button
              size="sm"
              className="h-7 w-full text-xs"
              onClick={handleStartShift}
              disabled={shiftActionLoading}
            >
              {shiftActionLoading ? (
                <Spinner className="mr-1 h-3 w-3" />
              ) : (
                <Play className="mr-1 h-3 w-3" />
              )}
              Iniciar Turno
            </Button>
          </div>
        )}
      </div>

      {/* ── Today's header ── */}
      <div className="flex shrink-0 items-center justify-between border-b bg-muted/20 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Citas de Hoy
          </span>
          {todayAppts.length > 0 && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {todayAppts.length}
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

      {/* ── Appointments list ── */}
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
                    "group flex items-start gap-2 px-3 py-2.5 transition-colors hover:bg-muted/30",
                    appt.status === "cancelled" && "opacity-40",
                  )}
                >
                  <div className="flex shrink-0 flex-col items-center gap-1 pt-0.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", statusDot)} />
                    <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                      {formatTime(appt.dateTime)}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold leading-tight">
                      {patient?.fullName ?? "Desconocido"}
                    </p>
                    <p className="truncate text-[10px] leading-tight text-muted-foreground">
                      {appt.reason}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    {appt.status === "scheduled" && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatus(appt, "completed")}
                        title="Completar"
                        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/30 dark:hover:text-green-400"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    )}
                    {appt.status === "scheduled" && (
                      <button
                        type="button"
                        onClick={() => handleQuickStatus(appt, "cancelled")}
                        title="Cancelar"
                        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                    {patient && (
                      <button
                        type="button"
                        onClick={() => onChargePatient(patient)}
                        title="Cobrar"
                        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-primary/10 hover:text-primary"
                      >
                        <Receipt className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Nav definition ───────────────────────────────────────────────────────────

const NAV = [
  { id: "cobro" as const, icon: Receipt, label: "Cobro" },
  { id: "citas" as const, icon: CalendarDays, label: "Citas" },
  { id: "pacientes" as const, icon: Users, label: "Pacientes" },
  { id: "turno" as const, icon: Clock, label: "Turno" },
];

// ── SecretaryDashboard ───────────────────────────────────────────────────────

interface SecretaryDashboardProps {
  session: AuthSession
}

export function SecretaryDashboard({ session }: SecretaryDashboardProps) {
  const { patients, isLoading: patientsLoading, addPatient, updatePatient } = usePatients();

  const [mode, setMode] = useState<Mode>("cobro");
  const [chargePatient, setChargePatient] = useState<Patient | null>(null);
  const [chargeKey, setChargeKey] = useState(0);

  const [patientView, setPatientView] = useState<PatientView>("list");
  const [focusedPatient, setFocusedPatient] = useState<Patient | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [isPatientSubmitting, setIsPatientSubmitting] = useState(false);

  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients;
    const q = patientSearch.toLowerCase();
    return patients.filter(
      (p) => p.fullName.toLowerCase().includes(q) ||
        p.phone.includes(patientSearch) ||
        p.email.toLowerCase().includes(q),
    );
  }, [patients, patientSearch]);

  const handleChargeFromSidebar = (patient: Patient) => {
    setChargePatient(patient);
    setChargeKey((k) => k + 1);
    setMode("cobro");
  };

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

  return (
    <div className="flex overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
      {/* ── Left nav ── */}
      <nav className="flex w-[72px] shrink-0 flex-col border-r border-border bg-card">
        {NAV.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
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
          {mode === "cobro" && (
            <CashierPanel
              key={chargeKey}
              patients={patients}
              defaultPatient={chargePatient ?? undefined}
            />
          )}

          {mode === "citas" && (
            <AppointmentsList patients={patients} session={session} />
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
                      Nuevo Paciente
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
                            <EmptyDescription>Registra el primer paciente del consultorio.</EmptyDescription>
                            <div className="flex justify-center">
                              <Button
                                onClick={() => {
                                  setFocusedPatient(null);
                                  setPatientView("form");
                                }}
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Nuevo Paciente
                              </Button>
                            </div>
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
                          onView={(pt) => {
                            setFocusedPatient(pt);
                            setPatientView("detail");
                          }}
                          onEdit={(pt) => {
                            setFocusedPatient(pt);
                            setPatientView("form");
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}

              {patientView === "detail" && focusedPatient && (
                <PatientDetail
                  patient={focusedPatient}
                  session={session}
                  onClose={() => setPatientView("list")}
                  onEdit={(pt) => {
                    setFocusedPatient(pt);
                    setPatientView("form");
                  }}
                />
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

          {mode === "turno" && (
            <div className="mx-auto max-w-xl">
              <ShiftPanel />
            </div>
          )}
        </div>
      </main>

      {/* ── Right sidebar ── */}
      <aside className="hidden w-[260px] shrink-0 overflow-hidden border-l border-border bg-muted/10 lg:flex lg:flex-col">
        <TodaySidebar patients={patients} onChargePatient={handleChargeFromSidebar} />
      </aside>
    </div>
  );
}
