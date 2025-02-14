import { env } from "@/config/env.config";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["info"],
  });

if (env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
