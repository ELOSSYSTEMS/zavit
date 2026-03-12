import { PrismaPg } from "@prisma/adapter-pg";
import prismaClientModule from "../../../generated/prisma/index.js";

const { PrismaClient } = prismaClientModule;

function resolveConnectionString() {
  return (
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL ??
    null
  );
}

export function createPrismaClient(connectionString = resolveConnectionString()) {
  if (!connectionString) {
    throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is required for Prisma runtime access.");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__zavitPrisma ??
  createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__zavitPrisma = prisma;
}
