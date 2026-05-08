import { redirect } from "next/navigation";

import { LoginForm } from "@/components/pages/login";
import { getSession, hasUsers } from "@/shared/lib/auth";

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  if (!(await hasUsers())) {
    redirect("/onboarding");
  }

  return <LoginForm />;
}
