import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const PROTECTED_PATHS = ["/perfil/me", "/amigos", "/onboarding"];

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (isProtected && !req.auth?.user?.id) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  const needsOnboarding =
    req.auth?.user?.id &&
    !req.auth.user.usernameSet &&
    pathname !== "/onboarding" &&
    !pathname.startsWith("/api/auth");

  if (needsOnboarding && isProtected) {
    return NextResponse.redirect(new URL("/onboarding", req.nextUrl.origin));
  }

  if (
    req.auth?.user?.id &&
    req.auth.user.usernameSet &&
    pathname === "/onboarding"
  ) {
    return NextResponse.redirect(new URL("/perfil/me", req.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/perfil/me",
    "/perfil/me/:path*",
    "/amigos",
    "/amigos/:path*",
    "/onboarding",
  ],
};
