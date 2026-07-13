import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getFriendshipsForUser, sendFriendRequest } from "@/lib/friendships";

export async function GET() {
  try {
    const user = await requireAuth();
    const friendships = await getFriendshipsForUser(user.id);
    return NextResponse.json(friendships);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro ao carregar amigos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { username } = body as { username?: string };

    if (!username?.trim()) {
      return NextResponse.json(
        { error: "Username é obrigatório" },
        { status: 400 }
      );
    }

    const friendship = await sendFriendRequest(user.id, username.trim());
    return NextResponse.json({ friendshipId: friendship.id });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao enviar pedido" },
      { status: 500 }
    );
  }
}
