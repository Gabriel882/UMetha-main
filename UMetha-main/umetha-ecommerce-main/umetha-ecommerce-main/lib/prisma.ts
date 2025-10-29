import { PrismaClient } from "@prisma/client";

// Check for global Prisma instance to avoid new instances in every request in development mode.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma || // If there's a global Prisma instance, use it
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"] // Log query, errors, and warnings in development
        : ["error"], // Log only errors in production
  });

// Store Prisma client globally in development to avoid creating multiple instances
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
