"use client";

import { useState } from "react";

import { Plus, Stethoscope, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import type { AuthSession } from "@/shared/lib/auth-types";

import { ConsultationForm } from "./consultation-form";
import { useConsultations } from "./hooks/use-consultations";
import type { Consultation, ConsultationFormData } from "./types/consultation";

interface ConsultationsListProps {
  patientId: string
  session: AuthSession
}

function ConsultationItem({
  consultation,
  canDelete,
  onEdit,
  onDelete,
}: {
  consultation: Consultation
  canDelete: boolean
  onEdit: (c: Consultation) => void
  onDelete: (c: Consultation) => void
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border-border/50 transition-colors hover:bg-muted/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Stethoscope className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm text-foreground">
                {new Date(`${consultation.date}T12:00:00`).toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-sm text-muted-foreground truncate">{consultation.reason}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded((v) => !v)}>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(consultation)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(consultation)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 text-sm">
            <Separator />
            {consultation.diagnosis && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Diagnóstico
                </p>
                <p>{consultation.diagnosis}</p>
              </div>
            )}
            {consultation.treatment && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Tratamiento
                </p>
                <p>{consultation.treatment}</p>
              </div>
            )}
            {consultation.notes && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Observaciones
                </p>
                <p>{consultation.notes}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ConsultationsList({ patientId, session }: ConsultationsListProps) {
  const { consultations, isLoading, addConsultation, updateConsultation, deleteConsultation } =
    useConsultations(patientId);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Consultation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canDelete = session.role === "admin";

  const handleSubmit = async (data: ConsultationFormData) => {
    setIsSubmitting(true);

    try {
      if (editing) {
        await updateConsultation(editing.id, data);
        toast.success("Consulta actualizada");
      } else {
        await addConsultation(data);
        toast.success("Consulta registrada");
      }

      setShowForm(false);
      setEditing(null);
    } catch (error) {
      toast.error("No se pudo guardar la consulta", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (c: Consultation) => {
    try {
      await deleteConsultation(c.id);
      toast.success("Consulta eliminada");
    } catch (error) {
      toast.error("No se pudo eliminar", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      });
    }
  };

  const handleEdit = (c: Consultation) => {
    setEditing(c);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {consultations.length}{" "}
          {consultations.length === 1 ? "consulta registrada" : "consultas registradas"}
        </span>
        {!showForm && (
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nueva Consulta
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <ConsultationForm
              consultation={editing ?? undefined}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isLoading={isSubmitting}
            />
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner className="h-5 w-5" />
        </div>
      ) : consultations.length === 0 && !showForm ? (
        <Empty className="py-8">
          <EmptyContent>
            <EmptyTitle>Sin consultas registradas</EmptyTitle>
            <EmptyDescription>Registra la primera consulta de este paciente.</EmptyDescription>
            <div className="flex justify-center">
              <Button size="sm" onClick={() => setShowForm(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Nueva Consulta
              </Button>
            </div>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="space-y-3">
          {consultations.map((c) => (
            <ConsultationItem
              key={c.id}
              consultation={c}
              canDelete={canDelete}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
