import { PrismaClient } from "@prisma/client";

// Normalize DATABASE_URL (strip quotes/whitespace) so Prisma works when Vercel passes a quoted value
const raw = process.env.DATABASE_URL;
if (raw) {
  let url = raw.trim();
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }
  process.env.DATABASE_URL = url;
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
