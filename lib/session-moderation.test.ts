import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateRemoveSessionParticipant } from "@/lib/session-moderation";

const creatorId = "creator-1";
const playerId = "player-2";
const spectatorId = "spectator-3";

const participants = [
  { id: creatorId },
  { id: playerId },
  { id: spectatorId },
];

describe("validateRemoveSessionParticipant", () => {
  it("prevents the creator from removing themselves", () => {
    assert.throws(
      () =>
        validateRemoveSessionParticipant({
          creatorParticipantId: creatorId,
          targetParticipantId: creatorId,
          participants,
        }),
      /Não é possível remover o criador da sala/
    );
  });

  it("rejects unknown participants", () => {
    assert.throws(
      () =>
        validateRemoveSessionParticipant({
          creatorParticipantId: creatorId,
          targetParticipantId: "missing",
          participants,
        }),
      /Participante não encontrado na sala/
    );
  });

  it("allows removing another player", () => {
    assert.doesNotThrow(() =>
      validateRemoveSessionParticipant({
        creatorParticipantId: creatorId,
        targetParticipantId: playerId,
        participants,
      })
    );
  });

  it("allows removing a spectator", () => {
    assert.doesNotThrow(() =>
      validateRemoveSessionParticipant({
        creatorParticipantId: creatorId,
        targetParticipantId: spectatorId,
        participants,
      })
    );
  });
});
