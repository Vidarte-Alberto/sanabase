import { redirect } from "next/navigation"

import { LoginForm } from "@/components/login-form"
import { getSession, hasUsers } from "@/lib/auth"

export default async function LoginPage() {
  const session = await getSession()

  if (session) {
    redirect("/")
  }

  if (!(await hasUsers())) {
    redirect("/onboarding")
  }

  return <LoginForm />
}
