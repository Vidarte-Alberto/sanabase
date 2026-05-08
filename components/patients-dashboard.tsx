"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyContent, EmptyDescription, EmptyTitle } from "@/components/ui/empty"
import { PatientCard } from "@/components/patient-card"
import { PatientForm } from "@/components/patient-form"
import { PatientDetail } from "@/components/patient-detail"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { SearchBar } from "@/components/search-bar"
import { StatsCards } from "@/components/stats-cards"
import { usePatients } from "@/hooks/use-patients"
import { toast } from "sonner"
import { UserPlus, Users, LayoutGrid, List } from "lucide-react"
import type { Patient, PatientFormData } from "@/lib/types"
import { Spinner } from "@/components/ui/spinner"
import type { AuthSession } from "@/lib/auth-types"

type ViewMode = "list" | "detail" | "form"

interface PatientsDashboardProps {
  session: AuthSession
}

export function PatientsDashboard({ session }: PatientsDashboardProps) {
  const { patients, isLoading, addPatient, updatePatient, deletePatient } = usePatients()
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [listStyle, setListStyle] = useState<"grid" | "list">("grid")
  const canDeletePatients = session.role === "admin"

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients
    const query = searchQuery.toLowerCase()
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        p.phone.includes(searchQuery)
    )
  }, [patients, searchQuery])

  const handleAddNew = () => {
    setSelectedPatient(null)
    setViewMode("form")
  }

  const handleView = (patient: Patient) => {
    setSelectedPatient(patient)
    setViewMode("detail")
  }

  const handleEdit = (patient: Patient) => {
    setSelectedPatient(patient)
    setViewMode("form")
  }

  const handleDelete = (patient: Patient) => {
    if (!canDeletePatients) {
      toast.error("No tienes permisos para eliminar pacientes")
      return
    }

    setPatientToDelete(patient)
  }

  const handleConfirmDelete = async () => {
    if (patientToDelete) {
      try {
        await deletePatient(patientToDelete.id)
        toast.success("Paciente eliminado", {
          description: `${patientToDelete.fullName} ha sido eliminado del sistema.`,
        })
        setPatientToDelete(null)
        if (selectedPatient?.id === patientToDelete.id) {
          setViewMode("list")
          setSelectedPatient(null)
        }
      } catch (error) {
        toast.error("No se pudo eliminar el paciente", {
          description: error instanceof Error ? error.message : "Intenta nuevamente.",
        })
      }
    }
  }

  const handleFormSubmit = async (data: PatientFormData) => {
    setIsSubmitting(true)

    try {
      if (selectedPatient) {
        await updatePatient(selectedPatient.id, data)
        toast.success("Paciente actualizado", {
          description: `Los datos de ${data.fullName} han sido actualizados.`,
        })
      } else {
        await addPatient(data)
        toast.success("Paciente registrado", {
          description: `${data.fullName} ha sido agregado al sistema.`,
        })
      }

      setViewMode("list")
      setSelectedPatient(null)
    } catch (error) {
      toast.error("No se pudo guardar el paciente", {
        description: error instanceof Error ? error.message : "Intenta nuevamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setViewMode("list")
    setSelectedPatient(null)
  }

  if (viewMode === "form") {
    return (
      <div className="mx-auto max-w-3xl">
        <PatientForm
          patient={selectedPatient || undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      </div>
    )
  }

  if (viewMode === "detail" && selectedPatient) {
    return (
      <div className="mx-auto max-w-3xl">
        <PatientDetail
          patient={selectedPatient}
          onClose={handleCancel}
          onEdit={handleEdit}
          onDelete={canDeletePatients ? handleDelete : undefined}
        />
        <DeleteConfirmDialog
          patient={patientToDelete}
          open={!!patientToDelete}
          onOpenChange={(open) => !open && setPatientToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsCards patients={patients} />

      {/* Patient List */}
      <Card className="border-border/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Lista de Pacientes
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center border border-border rounded-lg">
                <Button
                  variant={listStyle === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-r-none"
                  onClick={() => setListStyle("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={listStyle === "list" ? "secondary" : "ghost"}
                  size="sm"
                  className="rounded-l-none"
                  onClick={() => setListStyle("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={handleAddNew}>
                <UserPlus className="mr-2 h-4 w-4" />
                Nuevo Paciente
              </Button>
            </div>
          </div>
          <div className="pt-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Buscar por nombre, correo o teléfono..."
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6">
          {isLoading ? (
            <div className="flex min-h-56 items-center justify-center">
              <Spinner className="h-6 w-6" />
            </div>
          ) : filteredPatients.length === 0 ? (
            <Empty className="py-12">
              {searchQuery ? (
                <EmptyContent>
                  <EmptyTitle>No se encontraron pacientes</EmptyTitle>
                  <EmptyDescription>
                    No hay pacientes que coincidan con &quot;{searchQuery}&quot;
                  </EmptyDescription>
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                      Limpiar búsqueda
                    </Button>
                  </div>
                </EmptyContent>
              ) : (
                <EmptyContent>
                  <EmptyTitle>Sin pacientes registrados</EmptyTitle>
                  <EmptyDescription>
                    Comienza agregando tu primer paciente al sistema.
                  </EmptyDescription>
                  <div className="flex justify-center">
                    <Button onClick={handleAddNew}>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Agregar Paciente
                    </Button>
                  </div>
                </EmptyContent>
              )}
            </Empty>
          ) : (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                {filteredPatients.length}{" "}
                {filteredPatients.length === 1 ? "paciente encontrado" : "pacientes encontrados"}
              </div>
              <div
                className={
                  listStyle === "grid"
                    ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    : "space-y-3"
                }
              >
                {filteredPatients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={canDeletePatients ? handleDelete : undefined}
                  />
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        patient={patientToDelete}
        open={!!patientToDelete}
        onOpenChange={(open) => !open && setPatientToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
