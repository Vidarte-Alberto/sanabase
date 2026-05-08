import { Header } from "@/components/header"
import { PatientsDashboard } from "@/components/patients-dashboard"
import { Toaster } from "@/components/ui/sonner"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Panel de Administración
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gestiona la información de los pacientes del consultorio
          </p>
        </div>
        <PatientsDashboard />
      </main>
      <Toaster position="top-right" richColors />
    </div>
  )
}
