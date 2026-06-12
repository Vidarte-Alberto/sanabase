"use client";

import { useEffect, useState } from "react";

import {
  Clock,
  Play,
  Square,
  Banknote,
  CreditCard,
  ArrowLeftRight,
  DollarSign,
  CheckCircle,
  History,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

import { useShifts } from "./hooks/use-shifts";
import type { ShiftSummary } from "./types/shift";

function formatCurrency(amount: number) {
  return amount.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

function formatDatetime(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start: string, end: string | null) {
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  const minutes = Math.floor((endMs - startMs) / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
}

function SummaryBreakdown({ summary }: { summary: ShiftSummary }) {
  const rows = [
    { label: "Efectivo", icon: Banknote, value: summary.byMethod.cash, color: "text-green-600" },
    { label: "Tarjeta", icon: CreditCard, value: summary.byMethod.card, color: "text-blue-600" },
    { label: "Transferencia", icon: ArrowLeftRight, value: summary.byMethod.transfer, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-3">
      {rows.map(({ label, icon: Icon, value, color }) => (
        <div key={label} className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Icon className={`h-4 w-4 ${color}`} />
            {label}
          </div>
          <span className="text-sm font-medium">{formatCurrency(value)}</span>
        </div>
      ))}
      <Separator />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <DollarSign className="h-4 w-4 text-primary" />
          Total
        </div>
        <span className="font-bold text-lg text-primary">{formatCurrency(summary.totalAmount)}</span>
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {summary.paymentCount} {summary.paymentCount === 1 ? "pago" : "pagos"}
      </p>
    </div>
  );
}

function PastShiftCard({
  shiftId,
  startTime,
  endTime,
  getShiftSummary,
}: {
  shiftId: string
  startTime: string
  endTime: string | null
  getShiftSummary: (id: string) => Promise<ShiftSummary>
}) {
  const [summary, setSummary] = useState<ShiftSummary | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!expanded && !summary) {
      setLoading(true);

      try {
        const data = await getShiftSummary(shiftId);
        setSummary(data);
      } catch {
        toast.error("No se pudo cargar el resumen del turno");
      } finally {
        setLoading(false);
      }
    }

    setExpanded((v) => !v);
  };

  return (
    <Card className="border-border/50 transition-colors hover:bg-muted/20">
      <CardContent className="p-4">
        <button
          type="button"
          onClick={toggle}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{formatDatetime(startTime)}</p>
              <p className="text-xs text-muted-foreground">
                Duración: {formatDuration(startTime, endTime)}
              </p>
            </div>
          </div>
          {loading ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <Badge variant="secondary">Ver resumen</Badge>
          )}
        </button>

        {expanded && summary && (
          <div className="mt-4">
            <Separator className="mb-4" />
            <SummaryBreakdown summary={summary} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ShiftPanel() {
  const { activeShift, shifts, isLoading, startShift, closeShift, getShiftSummary } = useShifts();
  const [activeSummary, setActiveSummary] = useState<ShiftSummary | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!activeShift) {
      setActiveSummary(null);
      return;
    }

    getShiftSummary(activeShift.id)
      .then(setActiveSummary)
      .catch(() => null);
  }, [activeShift, getShiftSummary]);

  useEffect(() => {
    if (!activeShift) return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(id);
  }, [activeShift]);

  const handleStart = async () => {
    setIsActionLoading(true);

    try {
      await startShift();
      toast.success("Turno iniciado");
    } catch (error) {
      toast.error("No se pudo iniciar el turno", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleClose = async () => {
    if (!activeShift) {
      return;
    }

    setIsActionLoading(true);

    try {
      await closeShift(activeShift.id);
      toast.success("Turno cerrado", {
        description: activeSummary
          ? `Total recaudado: ${formatCurrency(activeSummary.totalAmount)}`
          : undefined,
      });
    } catch (error) {
      toast.error("No se pudo cerrar el turno", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const closedShifts = shifts.filter((s) => s.status === "closed");

  return (
    <div className="space-y-6">
      {/* Active Shift Card */}
      <Card className={activeShift ? "border-primary/40 bg-primary/5" : "border-border/50"}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className={`h-5 w-5 ${activeShift ? "text-primary" : "text-muted-foreground"}`} />
            {activeShift ? "Turno Activo" : "Sin Turno Activo"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeShift ? (
            <>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0">
                  En curso
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Inicio: {formatDatetime(activeShift.startTime)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Duración: {formatDuration(activeShift.startTime, null)}
              </p>

              {activeSummary && (
                <>
                  <Separator />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Resumen del turno</p>
                    <SummaryBreakdown summary={activeSummary} />
                  </div>
                </>
              )}

              <Button
                variant="destructive"
                onClick={handleClose}
                disabled={isActionLoading}
                className="w-full"
              >
                {isActionLoading ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <Square className="mr-2 h-4 w-4" />
                )}
                Cerrar Turno
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Inicia tu turno para registrar pagos y llevar el corte de caja.
              </p>
              <Button onClick={handleStart} disabled={isActionLoading} className="w-full">
                {isActionLoading ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}
                Iniciar Turno
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Past Shifts */}
      {closedShifts.length > 0 && (
        <div className="space-y-3">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <History className="h-3 w-3" />
            Turnos Anteriores
          </p>
          {closedShifts.map((shift) => (
            <PastShiftCard
              key={shift.id}
              shiftId={shift.id}
              startTime={shift.startTime}
              endTime={shift.endTime}
              getShiftSummary={getShiftSummary}
            />
          ))}
        </div>
      )}
    </div>
  );
}
