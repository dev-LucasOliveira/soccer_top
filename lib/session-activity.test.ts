import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeSessionLastActivityAt,
  DEFAULT_SESSION_RETENTION_MS,
  isSessionStale,
} from "@/lib/session-activity";

const baseCreatedAt = new Date("2026-07-01T10:00:00.000Z");

function buildSession(
  overrides: Partial<{
    createdAt: Date;
    participants: Array<{ joinedAt: Date; confirmedAt: Date | null }>;
    rounds: Array<{
      createdAt: Date;
      votes: Array<{ createdAt: Date }>;
      result: { createdAt: Date } | null;
      rankingMeta: Array<{ updatedAt: Date }>;
    }>;
    result: { createdAt: Date } | null;
  }> = {}
) {
  return {
    createdAt: overrides.createdAt ?? baseCreatedAt,
    participants: overrides.participants ?? [],
    rounds: overrides.rounds ?? [],
    result: overrides.result ?? null,
  };
}

describe("computeSessionLastActivityAt", () => {
  it("returns session createdAt when there is no other activity", () => {
    const lastActivity = computeSessionLastActivityAt(buildSession());
    assert.equal(lastActivity.toISOString(), baseCreatedAt.toISOString());
  });

  it("uses the most recent timestamp across participants, rounds and results", () => {
    const lastActivity = computeSessionLastActivityAt(
      buildSession({
        participants: [
          {
            joinedAt: new Date("2026-07-01T11:00:00.000Z"),
            confirmedAt: new Date("2026-07-01T12:00:00.000Z"),
          },
        ],
        rounds: [
          {
            createdAt: new Date("2026-07-01T13:00:00.000Z"),
            votes: [{ createdAt: new Date("2026-07-01T14:00:00.000Z") }],
            result: { createdAt: new Date("2026-07-01T15:00:00.000Z") },
            rankingMeta: [{ updatedAt: new Date("2026-07-01T16:00:00.000Z") }],
          },
        ],
        result: { createdAt: new Date("2026-07-01T17:00:00.000Z") },
      })
    );

    assert.equal(lastActivity.toISOString(), "2026-07-01T17:00:00.000Z");
  });
});

describe("isSessionStale", () => {
  it("marks sessions older than the retention window as stale", () => {
    const now = new Date("2026-07-03T10:00:00.000Z");
    const lastActivityAt = new Date("2026-07-01T10:00:00.000Z");

    assert.equal(
      isSessionStale(lastActivityAt, DEFAULT_SESSION_RETENTION_MS, now),
      true
    );
  });

  it("keeps sessions inside the retention window", () => {
    const now = new Date("2026-07-02T09:00:00.000Z");
    const lastActivityAt = new Date("2026-07-01T10:00:00.000Z");

    assert.equal(
      isSessionStale(lastActivityAt, DEFAULT_SESSION_RETENTION_MS, now),
      false
    );
  });
});
