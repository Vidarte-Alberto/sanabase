import "server-only"

import { prisma } from "@/lib/prisma"

const MAX_FAILED_ATTEMPTS = 5
const BLOCK_DURATION_MS = 15 * 60 * 1000
const loginRateLimitClient = prisma as typeof prisma & {
  loginRateLimit: {
    findUnique: typeof prisma.$extends extends never
      ? never
      : (args: { where: { key: string } }) => Promise<{
          key: string
          failedAttempts: number
          blockedUntil: string | null
          createdAt: string
          lastUpdated: string
        } | null>
    create: (args: {
      data: {
        key: string
        failedAttempts: number
        blockedUntil: string | null
        createdAt: string
        lastUpdated: string
      }
    }) => Promise<unknown>
    update: (args: {
      where: { key: string }
      data: {
        failedAttempts: number
        blockedUntil: string | null
        lastUpdated: string
      }
    }) => Promise<unknown>
    upsert: (args: {
      where: { key: string }
      update: {
        failedAttempts: number
        blockedUntil: string | null
        lastUpdated: string
      }
      create: {
        key: string
        failedAttempts: number
        blockedUntil: string | null
        createdAt: string
        lastUpdated: string
      }
    }) => Promise<unknown>
  }
}

function nowIso() {
  return new Date().toISOString()
}

function blockedUntilIso() {
  return new Date(Date.now() + BLOCK_DURATION_MS).toISOString()
}

function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase()
}

export async function getRateLimitStatus(identifier: string) {
  const key = normalizeIdentifier(identifier)
  const rateLimit = await loginRateLimitClient.loginRateLimit.findUnique({
    where: { key },
  })

  if (!rateLimit || !rateLimit.blockedUntil) {
    return { isBlocked: false as const, blockedUntil: null }
  }

  const isBlocked = new Date(rateLimit.blockedUntil).getTime() > Date.now()

  if (!isBlocked) {
    await loginRateLimitClient.loginRateLimit.update({
      where: { key },
      data: {
        failedAttempts: 0,
        blockedUntil: null,
        lastUpdated: nowIso(),
      },
    })
  }

  return {
    isBlocked,
    blockedUntil: isBlocked ? rateLimit.blockedUntil : null,
  }
}

export async function registerFailedLogin(identifier: string) {
  const key = normalizeIdentifier(identifier)
  const existingRateLimit = await loginRateLimitClient.loginRateLimit.findUnique({
    where: { key },
  })

  if (!existingRateLimit) {
    await loginRateLimitClient.loginRateLimit.create({
      data: {
        key,
        failedAttempts: 1,
        blockedUntil: null,
        createdAt: nowIso(),
        lastUpdated: nowIso(),
      },
    })
    return
  }

  const failedAttempts = existingRateLimit.failedAttempts + 1

  await loginRateLimitClient.loginRateLimit.update({
    where: { key },
    data: {
      failedAttempts,
      blockedUntil: failedAttempts >= MAX_FAILED_ATTEMPTS ? blockedUntilIso() : null,
      lastUpdated: nowIso(),
    },
  })
}

export async function clearFailedLogins(identifier: string) {
  const key = normalizeIdentifier(identifier)

  await loginRateLimitClient.loginRateLimit.upsert({
    where: { key },
    update: {
      failedAttempts: 0,
      blockedUntil: null,
      lastUpdated: nowIso(),
    },
    create: {
      key,
      failedAttempts: 0,
      blockedUntil: null,
      createdAt: nowIso(),
      lastUpdated: nowIso(),
    },
  })
}

export function buildRateLimitKeys(username: string, ipAddress: string) {
  return [`user:${normalizeIdentifier(username)}`, `ip:${normalizeIdentifier(ipAddress)}`]
}
