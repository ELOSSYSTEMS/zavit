import * as PrismaClientPackage from "@prisma/client";
import * as PrismaPgPackage from "@prisma/adapter-pg";

const { PrismaClient } = PrismaClientPackage as unknown as {
  PrismaClient: new (options?: { adapter: unknown }) => {
    source: {
      findMany: (...args: unknown[]) => Promise<unknown>;
    };
  };
};
const { PrismaPg } = PrismaPgPackage as unknown as {
  PrismaPg: new (options: { connectionString: string }) => unknown;
};

const connectionString =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL or DATABASE_URL_UNPOOLED is required for Prisma runtime access.");
}

const globalForPrisma = globalThis as {
  prisma?: InstanceType<typeof PrismaClient>;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
