import { redirect } from "next/navigation";

import { Header } from "@/components/layout";
import { DoctorDashboard, SecretaryDashboard } from "@/components/pages/dashboard";
import { getSession, hasUsers } from "@/shared/lib/auth";

export default async function HomePage() {
  const session = await getSession();

  if (!(await hasUsers())) {
    redirect("/onboarding");
  }

  if (!session) {
    redirect("/login");
  }

  if (session.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header session={session} />
        <SecretaryDashboard session={session} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header session={session} />
      <DoctorDashboard session={session} />
    </div>
  );
}
