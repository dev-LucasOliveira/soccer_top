import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveVoiceParticipantAccess } from "@/lib/voice-auth";

const participantId = "participant-1";
const guestToken = "guest-token-1";

const baseSession = {
  gameMode: "ranking",
  status: "completed",
  participants: [
    {
      id: participantId,
      guestToken,
      status: "building",
    },
  ],
};

describe("resolveVoiceParticipantAccess", () => {
  it("allows voice access when the session status is completed", () => {
    const result = resolveVoiceParticipantAccess(
      baseSession,
      participantId,
      guestToken
    );

    assert.equal(result.participant.id, participantId);
    assert.equal(result.canPublish, true);
  });

  it("allows voice access in lobby mode after return-to-lobby", () => {
    const result = resolveVoiceParticipantAccess(
      {
        ...baseSession,
        gameMode: "lobby",
        status: "setup",
      },
      participantId,
      guestToken
    );

    assert.equal(result.canPublish, true);
  });

  it("denies spectators from publishing audio", () => {
    const result = resolveVoiceParticipantAccess(
      {
        ...baseSession,
        participants: [
          {
            id: participantId,
            guestToken,
            status: "spectator",
          },
        ],
      },
      participantId,
      guestToken
    );

    assert.equal(result.canPublish, false);
  });

  it("rejects invalid guest tokens", () => {
    assert.throws(
      () =>
        resolveVoiceParticipantAccess(baseSession, participantId, "wrong-token"),
      /Não autorizado/
    );
  });
});
