import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export function participantStorageKey(sessionCode: string) {
  return `participant_${sessionCode}`;
}

export function isRemovedFromSessionResponse(res: Response, data: unknown): boolean {
  if (res.status !== 403) return false;
  return (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    (data as { code?: string }).code === "removed"
  );
}

export function clearSessionMembership(sessionCode: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(participantStorageKey(sessionCode));
}

export function handleRemovedFromSession(
  sessionCode: string,
  router: AppRouterInstance
) {
  clearSessionMembership(sessionCode);
  router.replace("/?removed=1");
}
