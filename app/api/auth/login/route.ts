import { NextResponse } from "next/server";

import { authenticateUser, createSessionCookie, hasUsers } from "@/shared/lib/auth";
import {
  buildRateLimitKeys,
  clearFailedLogins,
  getRateLimitStatus,
  registerFailedLogin,
} from "@/shared/lib/login-rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await hasUsers())) {
    return NextResponse.json(
      { error: "Primero debes completar la configuración inicial del sistema" },
      { status: 409 },
    );
  }

  const body = (await request.json()) as {
    username?: string
    password?: string
  };

  if (!body.username || !body.password) {
    return NextResponse.json(
      { error: "Usuario y contraseña son obligatorios" },
      { status: 400 },
    );
  }

  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const rateLimitKeys = buildRateLimitKeys(body.username, ipAddress);

  for (const rateLimitKey of rateLimitKeys) {
    const rateLimitStatus = await getRateLimitStatus(rateLimitKey);

    if (rateLimitStatus.isBlocked) {
      return NextResponse.json(
        { error: "Demasiados intentos fallidos. Intenta nuevamente más tarde." },
        { status: 429 },
      );
    }
  }

  const session = await authenticateUser(body.username, body.password);

  if (!session) {
    for (const rateLimitKey of rateLimitKeys) {
      await registerFailedLogin(rateLimitKey);
    }

    return NextResponse.json(
      { error: "Credenciales inválidas" },
      { status: 401 },
    );
  }

  for (const rateLimitKey of rateLimitKeys) {
    await clearFailedLogins(rateLimitKey);
  }

  await createSessionCookie(session);

  return NextResponse.json({
    user: session,
  });
}
