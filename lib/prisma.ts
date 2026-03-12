import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let client: PrismaClient;

if (!process.env.DATABASE_URL) {
  // Avoid initializing Prisma during build or when the URL is missing.
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "[prisma] DATABASE_URL not set – returning stub client until runtime."
    );
  }

  client = new Proxy({} as any, {
    get(_, prop) {
      throw new Error(
        `Prisma client not available because DATABASE_URL is missing. Tried to access '${String(
          prop
        )}'.`
      );
    },
  }) as any;
} else {
  client =
    globalForPrisma.prisma ??
    new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "warn", "error"]
          : ["error"],
    });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }
}

export const prisma = client;
