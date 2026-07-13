import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function getSession() {
  return auth();
}

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.appUser.findUnique({
    where: { id: session.user.id },
  });

  return user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
