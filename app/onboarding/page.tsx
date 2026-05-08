import { redirect } from "next/navigation";

import { OnboardingForm } from "@/components/pages/onboarding";
import { getSession, hasUsers } from "@/shared/lib/auth";

export default async function OnboardingPage() {
  const session = await getSession();

  if (session) {
    redirect("/");
  }

  if (await hasUsers()) {
    redirect("/login");
  }

  return <OnboardingForm />;
}
