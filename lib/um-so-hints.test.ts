import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GuessTopChallengeResolved } from "@/lib/guess-top-challenges";
import { buildHintLadder, getHintOrder } from "@/lib/um-so-hints";
import type { UmSoPlayerForHints } from "@/lib/um-so-hints";

const atacantesBraChallenge: GuessTopChallengeResolved = {
  id: "atacantes-bra",
  title: "Maiores atacantes brasileiros",
  description: "Test challenge",
  searchFilters: {
    nationalities: ["BRA"],
    positions: ["Atacante"],
  },
  pool: [
    {
      playerId: "1",
      playerName: "Ronaldo Nazário",
      nationality: "BRA",
      position: "Atacante",
      hint: { team: "Barcelona", from: 1996, to: 1997, label: "Barcelona (1996–1997)" },
    },
    {
      playerId: "2",
      playerName: "Romário",
      nationality: "BRA",
      position: "Atacante",
      hint: { team: "Flamengo", from: 1993, to: 1995, label: "Flamengo (1993–1995)" },
    },
  ],
};

const samplePlayer: UmSoPlayerForHints = {
  nationality: "BRA",
  primaryPosition: "Atacante",
  teams: JSON.stringify([
    { name: "Barcelona", from: 1996, to: 1997 },
    { name: "Inter de Milão", from: 1997, to: 2002 },
    { name: "Real Madrid", from: 2002, to: 2007 },
  ]),
  careerStart: 1996,
  careerEnd: 2007,
};

describe("buildHintLadder", () => {
  it("does not combine full career with start/end slices for nationality+position themes", () => {
    const ladder = buildHintLadder(samplePlayer, atacantesBraChallenge);
    const kinds = ladder.map((step) => step.kind);

    assert.equal(kinds.includes("career"), false);
    if (kinds.includes("career_start") || kinds.includes("career_end")) {
      assert.equal(kinds.includes("career"), false);
    }
    assert.equal(kinds[0], "career_start");
    assert.equal(kinds[1], "career_end");
  });

  it("keeps the first three hints semantically distinct", () => {
    const ladder = buildHintLadder(samplePlayer, atacantesBraChallenge);
    const firstThree = ladder.slice(0, 3).map((step) => step.text);
    const unique = new Set(firstThree);

    assert.equal(unique.size, 3);
    assert.equal(firstThree[0], "1996");
    assert.equal(firstThree[1], "2007");
    assert.notEqual(firstThree[2], firstThree[0]);
    assert.notEqual(firstThree[2], firstThree[1]);
  });

  it("allows progressive career_start and career_end without career in custom ladders", () => {
    const customChallenge: GuessTopChallengeResolved = {
      ...atacantesBraChallenge,
      umSoHintLadder: ["career_start", "career_end", "primary_club"],
    };

    const ladder = buildHintLadder(samplePlayer, customChallenge);

    assert.deepEqual(
      ladder.map((step) => step.kind),
      ["career_start", "career_end", "primary_club"]
    );
    assert.equal(ladder[0]?.text, "1996");
    assert.equal(ladder[1]?.text, "2007");
  });

  it("skips primary_club_era career fallback when career is already revealed", () => {
    const playerWithoutClubs: UmSoPlayerForHints = {
      nationality: "BRA",
      primaryPosition: "Atacante",
      teams: "",
      careerStart: 2000,
      careerEnd: 2010,
    };

    const customChallenge: GuessTopChallengeResolved = {
      ...atacantesBraChallenge,
      umSoHintLadder: ["career", "primary_club_era"],
    };

    const ladder = buildHintLadder(playerWithoutClubs, customChallenge);

    assert.deepEqual(ladder.map((step) => step.kind), ["career"]);
    assert.equal(ladder[0]?.text, "2000–2010");
  });

  it("uses nationality+position ladder order without career slices", () => {
    const order = getHintOrder(atacantesBraChallenge);

    assert.deepEqual(order, [
      "career_start",
      "career_end",
      "primary_club",
      "primary_club_era",
      "secondary_club",
      "secondary_club_era",
    ]);
  });
});
