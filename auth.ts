import NextAuth from "next-auth";
import { nanoid } from "nanoid";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account }) {
      if (!account?.providerAccountId || !user.email) {
        return false;
      }

      const googleId = account.providerAccountId;
      const email = user.email.toLowerCase();
      const displayName = user.name?.trim() || email.split("@")[0];
      const avatarUrl = user.image ?? null;

      const existing = await prisma.appUser.findUnique({
        where: { googleId },
      });

      if (existing) {
        await prisma.appUser.update({
          where: { id: existing.id },
          data: {
            displayName,
            avatarUrl,
            lastSeenAt: new Date(),
          },
        });
      } else {
        const tempUsername = `user_${nanoid(10).toLowerCase()}`;
        await prisma.appUser.create({
          data: {
            googleId,
            email,
            displayName,
            username: tempUsername,
            usernameSet: false,
            avatarUrl,
            lastSeenAt: new Date(),
          },
        });
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.user) {
        token.username = session.user.username;
        token.usernameSet = session.user.usernameSet;
      }

      if (user?.email) {
        token.email = user.email.toLowerCase();
      }

      const email = (token.email as string | undefined)?.toLowerCase();
      if (
        email &&
        (user?.email || trigger === "update" || !token.appUserId)
      ) {
        const appUser = await prisma.appUser.findUnique({
          where: { email },
          select: {
            id: true,
            username: true,
            usernameSet: true,
          },
        });

        if (appUser) {
          token.appUserId = appUser.id;
          token.username = appUser.username;
          token.usernameSet = appUser.usernameSet;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.appUserId) {
        session.user.id = token.appUserId as string;
        session.user.username = (token.username as string) ?? "";
        session.user.usernameSet = (token.usernameSet as boolean) ?? false;
      }
      return session;
    },
  },
});
