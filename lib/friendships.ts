import { prisma } from "@/lib/db";

export async function searchUsers(query: string, excludeUserId?: string) {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return [];

  return prisma.appUser.findMany({
    where: {
      usernameSet: true,
      username: { startsWith: normalized },
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
    orderBy: { username: "asc" },
    take: 20,
  });
}

export async function getFriendshipsForUser(userId: string) {
  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    include: {
      requester: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
      addressee: {
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const accepted = friendships
    .filter((f) => f.status === "accepted")
    .map((f) => {
      const friend = f.requesterId === userId ? f.addressee : f.requester;
      return {
        friendshipId: f.id,
        ...friend,
      };
    });

  const pendingIncoming = friendships
    .filter((f) => f.status === "pending" && f.addresseeId === userId)
    .map((f) => ({
      friendshipId: f.id,
      ...f.requester,
    }));

  const pendingOutgoing = friendships
    .filter((f) => f.status === "pending" && f.requesterId === userId)
    .map((f) => ({
      friendshipId: f.id,
      ...f.addressee,
    }));

  return { accepted, pendingIncoming, pendingOutgoing };
}

export async function sendFriendRequest(
  requesterId: string,
  addresseeUsername: string
) {
  const addressee = await prisma.appUser.findUnique({
    where: { username: addresseeUsername.toLowerCase() },
  });

  if (!addressee || !addressee.usernameSet) {
    throw new Error("Usuário não encontrado");
  }

  if (addressee.id === requesterId) {
    throw new Error("Você não pode adicionar a si mesmo");
  }

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId: addressee.id },
        { requesterId: addressee.id, addresseeId: requesterId },
      ],
    },
  });

  if (existing) {
    if (existing.status === "accepted") {
      throw new Error("Vocês já são amigos");
    }
    if (existing.status === "pending") {
      throw new Error("Já existe um pedido pendente");
    }
    if (existing.status === "blocked") {
      throw new Error("Não foi possível enviar pedido");
    }
  }

  return prisma.friendship.create({
    data: {
      requesterId,
      addresseeId: addressee.id,
      status: "pending",
    },
  });
}

export async function respondToFriendRequest(
  userId: string,
  friendshipId: string,
  action: "accept" | "reject"
) {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (!friendship || friendship.addresseeId !== userId) {
    throw new Error("Pedido não encontrado");
  }

  if (friendship.status !== "pending") {
    throw new Error("Pedido já respondido");
  }

  if (action === "reject") {
    await prisma.friendship.delete({ where: { id: friendshipId } });
    return { status: "rejected" as const };
  }

  await prisma.friendship.update({
    where: { id: friendshipId },
    data: { status: "accepted", respondedAt: new Date() },
  });

  return { status: "accepted" as const };
}

export async function removeFriendship(userId: string, friendshipId: string) {
  const friendship = await prisma.friendship.findUnique({
    where: { id: friendshipId },
  });

  if (
    !friendship ||
    (friendship.requesterId !== userId && friendship.addresseeId !== userId)
  ) {
    throw new Error("Amizade não encontrada");
  }

  await prisma.friendship.delete({ where: { id: friendshipId } });
}

export async function getAcceptedFriendIds(userId: string): Promise<string[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "accepted",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });

  return friendships.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId
  );
}

export async function getFriendshipStatus(
  viewerId: string,
  targetUserId: string
): Promise<"none" | "pending_sent" | "pending_received" | "accepted" | "self"> {
  if (viewerId === targetUserId) return "self";

  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: viewerId, addresseeId: targetUserId },
        { requesterId: targetUserId, addresseeId: viewerId },
      ],
    },
  });

  if (!friendship) return "none";
  if (friendship.status === "accepted") return "accepted";
  if (friendship.status === "pending" && friendship.requesterId === viewerId) {
    return "pending_sent";
  }
  if (friendship.status === "pending") return "pending_received";
  return "none";
}
