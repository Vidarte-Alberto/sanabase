"use client";

import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Droplet,
  AlertTriangle,
  FileText,
  Stethoscope,
  ClipboardList,
  X,
  Pencil,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AuthSession } from "@/shared/lib/auth-types";

import { ConsultationsList } from "./consultations-list";
import { PaymentsList } from "./payments-list";
import { GENDER_LABELS, type Patient } from "./types";

interface PatientDetailProps {
  patient: Patient
  session: AuthSession
  onClose: () => void
  onEdit: (patient: Patient) => void
  onDelete?: (patient: Patient) => void
}

export function PatientDetail({ patient, session, onClose, onEdit, onDelete }: PatientDetailProps) {
  const getBloodTypeBadgeColor = (type: string) => {
    const colors: Record<string, string> = {
      "O+": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      "O-": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      "A+": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      "A-": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      "B+": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      "B-": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      "AB+": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      "AB-": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return colors[type] || "bg-muted text-muted-foreground";
  };

  return (
    <Card className="w-full border-border/50 shadow-lg">
      <CardHeader className="border-b border-border/50 bg-muted/30">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-8 w-8" />
            </div>
            <div>
              <CardTitle className="text-xl">{patient.fullName}</CardTitle>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span>{patient.age} años</span>
                <span className="text-border">•</span>
                <span>{GENDER_LABELS[patient.gender]}</span>
                <Badge
                  variant="secondary"
                  className={getBloodTypeBadgeColor(patient.bloodType)}
                >
                  <Droplet className="mr-1 h-3 w-3" />
                  {patient.bloodType}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList>
            <TabsTrigger value="info">
              <User className="h-4 w-4" />
              Información
            </TabsTrigger>
            <TabsTrigger value="consultations">
              <Stethoscope className="h-4 w-4" />
              Consultas
            </TabsTrigger>
            <TabsTrigger value="payments">
              <ClipboardList className="h-4 w-4" />
              Pagos
            </TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info">
            <div className="space-y-6">
              <section>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Información Personal
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Fecha de Nacimiento</p>
                      <p className="font-medium">
                        {new Date(`${patient.birthDate}T12:00:00`).toLocaleDateString("es-MX", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Droplet className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tipo de Sangre</p>
                      <p className="font-medium">{patient.bloodType}</p>
                    </div>
                  </div>
                </div>
              </section>

              <Separator />

              <section>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Información de Contacto
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Phone className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Teléfono</p>
                      <p className="font-medium">{patient.phone}</p>
                    </div>
                  </div>
                  {patient.email && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Mail className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Correo Electrónico</p>
                        <p className="font-medium">{patient.email}</p>
                      </div>
                    </div>
                  )}
                  {patient.address && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Dirección</p>
                        <p className="font-medium">{patient.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>

              <Separator />

              <section>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                  Información Médica
                </p>
                <div className="space-y-4">
                  {patient.allergies && (
                    <div className="p-4 rounded-lg border border-warning/30 bg-warning/5">
                      <div className="flex items-center gap-2 text-warning mb-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span className="font-medium">Alergias</span>
                      </div>
                      <p className="text-sm text-foreground">{patient.allergies}</p>
                    </div>
                  )}
                  {patient.medicalHistory && (
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-primary mb-2">
                        <FileText className="h-5 w-5" />
                        <span className="font-medium">Antecedentes Médicos</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{patient.medicalHistory}</p>
                    </div>
                  )}
                  {patient.consultationReason && (
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-primary mb-2">
                        <Stethoscope className="h-5 w-5" />
                        <span className="font-medium">Motivo de Consulta</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{patient.consultationReason}</p>
                    </div>
                  )}
                  {patient.notes && (
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 text-primary mb-2">
                        <ClipboardList className="h-5 w-5" />
                        <span className="font-medium">Observaciones</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{patient.notes}</p>
                    </div>
                  )}
                </div>
              </section>

              <Separator />

              <section className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="font-medium">Registro:</span>{" "}
                  {new Date(`${patient.registrationDate}T12:00:00`).toLocaleDateString("es-MX")}
                </div>
                <div>
                  <span className="font-medium">Última actualización:</span>{" "}
                  {new Date(`${patient.lastUpdated}T12:00:00`).toLocaleDateString("es-MX")}
                </div>
              </section>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-border/50">
                <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                  Cerrar
                </Button>
                {onDelete ? (
                  <Button
                    variant="outline"
                    onClick={() => onDelete(patient)}
                    className="flex-1 sm:flex-none text-destructive hover:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </Button>
                ) : null}
                <Button onClick={() => onEdit(patient)} className="flex-1 sm:flex-none">
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Consultations Tab */}
          <TabsContent value="consultations">
            <ConsultationsList patientId={patient.id} session={session} />
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments">
            <PaymentsList patientId={patient.id} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
