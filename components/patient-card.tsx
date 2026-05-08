"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GENDER_LABELS } from "@/lib/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Droplet,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react"
import type { Patient } from "@/lib/types"

interface PatientCardProps {
  patient: Patient
  onView: (patient: Patient) => void
  onEdit: (patient: Patient) => void
  onDelete?: (patient: Patient) => void
}

export function PatientCard({ patient, onView, onEdit, onDelete }: PatientCardProps) {
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
    }
    return colors[type] || "bg-muted text-muted-foreground"
  }

  return (
    <Card className="group relative overflow-hidden border-border/50 transition-all duration-200 hover:border-primary/30 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground truncate">
                  {patient.fullName}
                </h3>
                <Badge variant="secondary" className={getBloodTypeBadgeColor(patient.bloodType)}>
                  <Droplet className="mr-1 h-3 w-3" />
                  {patient.bloodType}
                </Badge>
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <span>{patient.age} años</span>
                <span className="text-border">•</span>
                <span>{GENDER_LABELS[patient.gender]}</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView(patient)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(patient)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              {onDelete ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(patient)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0" />
            <span className="truncate">{patient.phone}</span>
          </div>
          {patient.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{patient.email}</span>
            </div>
          )}
          {patient.address && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{patient.address}</span>
            </div>
          )}
        </div>

        {patient.consultationReason && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-sm text-muted-foreground line-clamp-2">
              <span className="font-medium text-foreground">Motivo: </span>
              {patient.consultationReason}
            </p>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>Registro: {new Date(patient.registrationDate).toLocaleDateString("es-MX")}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onView(patient)}
          >
            Ver más
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
