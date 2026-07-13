import { getCurrentUser } from "@/lib/auth";

export type ParticipantAuthContext = {
  userId: string | null;
  displayName: string | null;
};

/**
 * Logged-in users always use their nickname (username).
 * Guests get null here — callers must require a displayName from the client.
 */
export async function getParticipantAuthContext(): Promise<ParticipantAuthContext> {
  const user = await getCurrentUser();
  if (!user) {
    return { userId: null, displayName: null };
  }

  return {
    userId: user.id,
    displayName: user.username || user.displayName,
  };
}
