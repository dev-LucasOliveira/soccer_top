import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { getOwnUserProfile } from "@/lib/user-profile";
import { normalizeUsername, validateUsername } from "@/lib/username";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const profile = await getOwnUserProfile(user.id);
    return NextResponse.json(profile);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Erro ao carregar perfil" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const body = await request.json();
    const { username } = body as { username?: string };

    if (!username) {
      return NextResponse.json(
        { error: "Username é obrigatório" },
        { status: 400 }
      );
    }

    const validationError = validateUsername(username);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const normalized = normalizeUsername(username);

    const taken = await prisma.appUser.findFirst({
      where: {
        username: normalized,
        id: { not: user.id },
      },
    });

    if (taken) {
      return NextResponse.json(
        { error: "Username já está em uso" },
        { status: 409 }
      );
    }

    try {
      const updated = await prisma.appUser.update({
        where: { id: user.id },
        data: {
          username: normalized,
          usernameSet: true,
        },
        select: {
          username: true,
          usernameSet: true,
        },
      });

      return NextResponse.json(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return NextResponse.json(
          { error: "Username já está em uso" },
          { status: 409 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}
