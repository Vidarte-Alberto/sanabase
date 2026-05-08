import { redirect } from "next/navigation"

import { Header } from "@/components/header"
import { PatientsDashboard } from "@/components/patients-dashboard"
import { getSession, hasUsers } from "@/lib/auth"

export default async function HomePage() {
  const session = await getSession()

  if (!(await hasUsers())) {
    redirect("/onboarding")
  }

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header session={session} />
      <main className="container mx-auto px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Panel de Administración
          </h1>
          <p className="mt-1 text-muted-foreground">
            Gestiona la información de los pacientes del consultorio
          </p>
        </div>
        <PatientsDashboard session={session} />
      </main>
    </div>
  )
}
