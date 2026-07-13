import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      username: string;
      usernameSet: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    appUserId: string;
    username: string;
    usernameSet: boolean;
  }
}
