import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFriendshipStatus } from "@/lib/friendships";
import { getUserProfileByUsername } from "@/lib/user-profile";

type RouteContext = { params: Promise<{ username: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { username } = await context.params;
    const profile = await getUserProfileByUsername(username);

    if (!profile) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const viewer = await getCurrentUser();
    const friendshipStatus = viewer
      ? await getFriendshipStatus(viewer.id, profile.id)
      : "none";

    return NextResponse.json({ ...profile, friendshipStatus });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Erro ao carregar perfil" },
      { status: 500 }
    );
  }
}
