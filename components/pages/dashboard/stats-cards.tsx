"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, UserPlus, Activity, Calendar } from "lucide-react"
import type { Patient } from "./types"

interface StatsCardsProps {
  patients: Patient[]
}

export function StatsCards({ patients }: StatsCardsProps) {
  const totalPatients = patients.length
  
  const recentPatients = patients.filter((p) => {
    const registrationDate = new Date(p.registrationDate)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    return registrationDate >= thirtyDaysAgo
  }).length

  const avgAge = patients.length > 0
    ? Math.round(patients.reduce((sum, p) => sum + p.age, 0) / patients.length)
    : 0

  const stats = [
    {
      title: "Total Pacientes",
      value: totalPatients,
      icon: Users,
      description: "Pacientes registrados",
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Nuevos (30 días)",
      value: recentPatients,
      icon: UserPlus,
      description: "Registros recientes",
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Edad Promedio",
      value: `${avgAge} años`,
      icon: Activity,
      description: "De todos los pacientes",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Última Actividad",
      value: "Hoy",
      icon: Calendar,
      description: "Sistema actualizado",
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
