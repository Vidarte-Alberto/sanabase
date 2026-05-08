import { redirect } from "next/navigation"

import { OnboardingForm } from "@/components/onboarding-form"
import { getSession, hasUsers } from "@/lib/auth"

export default async function OnboardingPage() {
  const session = await getSession()

  if (session) {
    redirect("/")
  }

  if (await hasUsers()) {
    redirect("/login")
  }

  return <OnboardingForm />
}
