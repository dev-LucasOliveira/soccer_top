import { getCurrentUser } from "@/lib/auth";

export type ParticipantAuthContext = {
  userId: string | null;
  displayName: string | null;
};

export async function getParticipantAuthContext(
  requestedDisplayName?: string
): Promise<ParticipantAuthContext> {
  const user = await getCurrentUser();
  if (!user) {
    return { userId: null, displayName: null };
  }

  const displayName =
    requestedDisplayName?.trim() || user.displayName || user.username;

  return {
    userId: user.id,
    displayName,
  };
}
