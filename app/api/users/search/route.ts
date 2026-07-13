import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { searchUsers } from "@/lib/friendships";

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") ?? "";

    const results = await searchUsers(query, user.id);
    return NextResponse.json({ users: results });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    console.error(error);
    return NextResponse.json({ error: "Erro na busca" }, { status: 500 });
  }
}
