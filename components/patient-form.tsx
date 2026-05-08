"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { X, Save, UserPlus } from "lucide-react"
import type { Patient, PatientFormData } from "@/lib/types"
import { BLOOD_TYPES, GENDER_LABELS, GENDER_OPTIONS } from "@/lib/types"

interface PatientFormProps {
  patient?: Patient
  onSubmit: (data: PatientFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const initialFormData: PatientFormData = {
  fullName: "",
  age: 0,
  gender: "Male",
  birthDate: "",
  phone: "",
  address: "",
  email: "",
  bloodType: "O+",
  allergies: "",
  medicalHistory: "",
  consultationReason: "",
  notes: "",
}

export function PatientForm({ patient, onSubmit, onCancel, isLoading }: PatientFormProps) {
  const [formData, setFormData] = useState<PatientFormData>(initialFormData)
  const isEditing = !!patient

  useEffect(() => {
    if (patient) {
      setFormData({
        fullName: patient.fullName,
        age: patient.age,
        gender: patient.gender,
        birthDate: patient.birthDate,
        phone: patient.phone,
        address: patient.address,
        email: patient.email,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
        medicalHistory: patient.medicalHistory,
        consultationReason: patient.consultationReason,
        notes: patient.notes,
      })
      return
    }

    setFormData(initialFormData)
  }, [patient])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const updateField = <K extends keyof PatientFormData>(field: K, value: PatientFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Card className="w-full border-border/50 shadow-lg">
      <CardHeader className="border-b border-border/50 bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              {isEditing ? (
                <>
                  <Save className="h-5 w-5 text-primary" />
                  Editar Paciente
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5 text-primary" />
                  Nuevo Paciente
                </>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {isEditing
                ? "Actualiza la información del paciente"
                : "Ingresa los datos del nuevo paciente"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Información Personal
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="fullName">Nombre Completo *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="Nombre completo del paciente"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => {
                    updateField("birthDate", e.target.value)
                    const birthDate = new Date(e.target.value)
                    const today = new Date()
                    let age = today.getFullYear() - birthDate.getFullYear()
                    const monthDiff = today.getMonth() - birthDate.getMonth()
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                      age--
                    }
                    updateField("age", age > 0 ? age : 0)
                  }}
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="age">Edad</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateField("age", parseInt(e.target.value) || 0)}
                  min={0}
                  max={150}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="gender">Sexo *</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => updateField("gender", value as PatientFormData["gender"])}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GENDER_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {GENDER_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bloodType">Tipo de Sangre *</Label>
                <Select
                  value={formData.bloodType}
                  onValueChange={(value) =>
                    updateField("bloodType", value as PatientFormData["bloodType"])
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BLOOD_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Información de Contacto
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="phone">Teléfono *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="555-123-4567"
                  required
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="paciente@email.com"
                  className="mt-1.5"
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  placeholder="Calle, número, colonia, ciudad"
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Información Médica
            </h3>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="allergies">Alergias</Label>
                <Textarea
                  id="allergies"
                  value={formData.allergies}
                  onChange={(e) => updateField("allergies", e.target.value)}
                  placeholder="Lista de alergias conocidas..."
                  rows={2}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="medicalHistory">Antecedentes Médicos</Label>
                <Textarea
                  id="medicalHistory"
                  value={formData.medicalHistory}
                  onChange={(e) => updateField("medicalHistory", e.target.value)}
                  placeholder="Historial médico relevante..."
                  rows={3}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="consultationReason">Motivo de Consulta</Label>
                <Textarea
                  id="consultationReason"
                  value={formData.consultationReason}
                  onChange={(e) => updateField("consultationReason", e.target.value)}
                  placeholder="Razón de la visita..."
                  rows={2}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="notes">Observaciones Generales</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateField("notes", e.target.value)}
                  placeholder="Notas adicionales..."
                  rows={3}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-border/50">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1 sm:flex-none">
              {isLoading && <Spinner className="mr-2 h-4 w-4" />}
              {isEditing ? "Guardar Cambios" : "Registrar Paciente"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
