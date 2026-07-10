import { getPrisma } from "@/lib/prisma";

export const prisma = getPrisma();

if (process.env.NODE_ENV !== "production") {
  getPrisma();
}
