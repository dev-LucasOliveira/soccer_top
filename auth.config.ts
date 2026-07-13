import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? process.env.AUTH_GOOGLE_ID,
      clientSecret:
        process.env.GOOGLE_CLIENT_SECRET ?? process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
  callbacks: {
    session({ session, token }) {
      if (session.user && token.appUserId) {
        session.user.id = token.appUserId as string;
        session.user.username = (token.username as string) ?? "";
        session.user.usernameSet = (token.usernameSet as boolean) ?? false;
      }
      return session;
    },
    jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session?.user) {
        token.username = session.user.username;
        token.usernameSet = session.user.usernameSet;
      }

      if (user?.email) {
        token.email = user.email.toLowerCase();
      }

      return token;
    },
  },
} satisfies NextAuthConfig;
