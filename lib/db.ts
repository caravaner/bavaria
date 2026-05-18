import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }
  // The pg driver doesn't understand Prisma's ?schema=… URL convention,
  // so extract it and pass it to the adapter explicitly.
  const url = new URL(connectionString);
  const schema = url.searchParams.get("schema") ?? undefined;
  const adapter = new PrismaPg({ connectionString }, { schema });
  return new PrismaClient({ adapter });
}

/** Prisma client singleton — reused across HMR reloads to avoid exhausting DB connections in dev. */
export const db: PrismaClient = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
