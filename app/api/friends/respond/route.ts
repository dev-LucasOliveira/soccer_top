import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { respondToFriendRequest } from "@/lib/friendships";

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { friendshipId, action } = body as {
      friendshipId?: string;
      action?: "accept" | "reject";
    };

    if (!friendshipId || (action !== "accept" && action !== "reject")) {
      return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
    }

    const result = await respondToFriendRequest(user.id, friendshipId, action);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao responder pedido" },
      { status: 500 }
    );
  }
}
