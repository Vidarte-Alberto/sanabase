"use client";

import { useCallback, useEffect, useState } from "react";

import {
  DollarSign,
  Stethoscope,
  UserPlus,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Users,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";

type Period = "today" | "week" | "month"

interface AnalyticsData {
  period: Period
  from: string
  to: string
  totalRevenue: number
  paymentCount: number
  consultationCount: number
  newPatients: number
  totalPatients: number
  byMethod: {
    cash: number
    card: number
    transfer: number
  }
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoy",
  week: "Esta Semana",
  month: "Este Mes",
};

export function AdminAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<Period>("today");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (p: Period) => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/analytics?period=${p}`, { cache: "no-store" });

      if (!response.ok) {
        throw new Error("No se pudo cargar el dashboard");
      }

      setData((await response.json()) as AnalyticsData);
    } catch (error) {
      toast.error("Error al cargar el dashboard", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(period);
  }, [period, load]);

  const stats = data
    ? [
        {
          title: "Ingresos",
          value: formatCurrency(data.totalRevenue),
          icon: DollarSign,
          color: "text-green-600",
          bg: "bg-green-100 dark:bg-green-900/30",
          description: `${data.paymentCount} pagos`,
        },
        {
          title: "Consultas",
          value: data.consultationCount,
          icon: Stethoscope,
          color: "text-primary",
          bg: "bg-primary/10",
          description: "Atenciones registradas",
        },
        {
          title: "Nuevos Pacientes",
          value: data.newPatients,
          icon: UserPlus,
          color: "text-chart-2",
          bg: "bg-chart-2/10",
          description: "Registros en el periodo",
        },
        {
          title: "Total Pacientes",
          value: data.totalPatients,
          icon: Users,
          color: "text-chart-4",
          bg: "bg-chart-4/10",
          description: "En el sistema",
        },
      ]
    : [];

  const methodRows = data
    ? [
        { label: "Efectivo", icon: Banknote, value: data.byMethod.cash, color: "text-green-600" },
        { label: "Tarjeta", icon: CreditCard, value: data.byMethod.card, color: "text-blue-600" },
        {
          label: "Transferencia",
          icon: ArrowLeftRight,
          value: data.byMethod.transfer,
          color: "text-purple-600",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground mr-2">Período:</span>
        <div className="flex border border-border rounded-lg overflow-hidden">
          {(["today", "week", "month"] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none border-0"
              onClick={() => setPeriod(p)}
            >
              {PERIOD_LABELS[p]}
            </Button>
          ))}
        </div>
        {data && (
          <span className="text-xs text-muted-foreground ml-2">
            {new Date(`${data.from}T12:00:00`).toLocaleDateString("es-MX")}
            {data.from !== data.to && (
              <> — {new Date(`${data.to}T12:00:00`).toLocaleDateString("es-MX")}</>
            )}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{stat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Payment breakdown */}
          {data && (
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Desglose por Método de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {methodRows.map(({ label, icon: Icon, value, color }) => {
                    const pct = data.totalRevenue > 0
                      ? Math.round((value / data.totalRevenue) * 100)
                      : 0;

                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2 text-sm">
                            <Icon className={`h-4 w-4 ${color}`} />
                            {label}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">{formatCurrency(value)}</span>
                            <span className="text-muted-foreground ml-2">{pct}%</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <Separator />
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Total</span>
                    <span className="text-lg text-primary">{formatCurrency(data.totalRevenue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
