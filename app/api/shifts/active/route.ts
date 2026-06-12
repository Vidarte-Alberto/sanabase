import { NextResponse } from "next/server";

import { createUnauthorizedResponse, requireSession } from "@/shared/lib/auth";
import { getActiveShift } from "@/shared/server/dashboard/shifts-db";

export const runtime = "nodejs";

export async function GET() {
  const session = await requireSession();

  if (!session) {
    return createUnauthorizedResponse();
  }

  const shift = await getActiveShift(session.userId);
  return NextResponse.json(shift);
}
