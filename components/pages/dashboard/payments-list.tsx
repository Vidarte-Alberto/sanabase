"use client";

import { useState } from "react";

import { Plus, CreditCard, Banknote, ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";

import { usePayments } from "./hooks/use-payments";
import { PaymentForm } from "./payment-form";
import { PAYMENT_METHOD_LABELS, type PaymentFormData, type PaymentMethod } from "./types/payment";

const METHOD_ICONS: Record<PaymentMethod, React.ElementType> = {
  cash: Banknote,
  card: CreditCard,
  transfer: ArrowLeftRight,
};

const METHOD_COLORS: Record<PaymentMethod, string> = {
  cash: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  card: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  transfer: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

interface PaymentsListProps {
  patientId: string
}

function formatCurrency(amount: number) {
  return amount.toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export function PaymentsList({ patientId }: PaymentsListProps) {
  const { payments, isLoading, addPayment } = usePayments(patientId);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true);

    try {
      await addPayment(data);
      toast.success("Pago registrado", {
        description: `${formatCurrency(data.amount)} — ${data.concept}`,
      });
      setShowForm(false);
    } catch (error) {
      toast.error("No se pudo registrar el pago", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {payments.length} {payments.length === 1 ? "pago registrado" : "pagos registrados"}
          </span>
          {payments.length > 0 && (
            <Badge variant="secondary" className="border-0 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Total: {formatCurrency(totalPaid)}
            </Badge>
          )}
        </div>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Registrar Pago
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <PaymentForm
              onSubmit={handleSubmit}
              onCancel={() => setShowForm(false)}
              isLoading={isSubmitting}
            />
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-5 w-5" />
        </div>
      ) : payments.length === 0 && !showForm ? (
        <Empty className="py-8">
          <EmptyContent>
            <EmptyTitle>Sin pagos registrados</EmptyTitle>
            <EmptyDescription>Registra el primer pago de este paciente.</EmptyDescription>
            <div className="flex justify-center">
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Registrar Pago
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => {
            const MethodIcon = METHOD_ICONS[payment.paymentMethod];

            return (
              <Card key={payment.id} className="border-border/50 transition-colors hover:bg-muted/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${METHOD_COLORS[payment.paymentMethod]}`}>
                        <MethodIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{payment.concept}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(`${payment.date}T12:00:00`).toLocaleDateString("es-MX")}
                          {" · "}
                          {PAYMENT_METHOD_LABELS[payment.paymentMethod]}
                        </p>
                      </div>
                    </div>
                    <p className="shrink-0 font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
