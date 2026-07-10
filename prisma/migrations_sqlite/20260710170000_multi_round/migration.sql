-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "topN" INTEGER NOT NULL,
    "filters" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "listAliases" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Round_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoundResult" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoundResult_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Alter Session: add currentRoundNumber
ALTER TABLE "Session" ADD COLUMN "currentRoundNumber" INTEGER NOT NULL DEFAULT 1;

-- Migrate existing sessions to Round 1
INSERT INTO "Round" ("id", "sessionId", "number", "title", "topN", "filters", "status", "listAliases", "createdAt")
SELECT
    lower(hex(randomblob(12))),
    "id",
    1,
    "title",
    "topN",
    "filters",
    CASE "status"
        WHEN 'open' THEN 'open'
        WHEN 'voting' THEN 'voting'
        WHEN 'completed' THEN 'completed'
        ELSE 'pending'
    END,
    "listAliases",
    "createdAt"
FROM "Session";

-- Update session status mapping
UPDATE "Session" SET "status" = 'active' WHERE "status" IN ('open', 'voting');
UPDATE "Session" SET "status" = 'setup' WHERE "status" NOT IN ('active', 'completed');

-- Recreate Pick with roundId
CREATE TABLE "Pick_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    CONSTRAINT "Pick_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pick_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Pick_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "Pick_new" ("id", "roundId", "participantId", "playerId", "rank")
SELECT p."id", r."id", p."participantId", p."playerId", p."rank"
FROM "Pick" p
JOIN "Participant" part ON part."id" = p."participantId"
JOIN "Round" r ON r."sessionId" = part."sessionId" AND r."number" = 1;

DROP TABLE "Pick";
ALTER TABLE "Pick_new" RENAME TO "Pick";

CREATE UNIQUE INDEX "Pick_roundId_participantId_rank_key" ON "Pick"("roundId", "participantId", "rank");
CREATE UNIQUE INDEX "Pick_roundId_participantId_playerId_key" ON "Pick"("roundId", "participantId", "playerId");
CREATE INDEX "Pick_roundId_participantId_idx" ON "Pick"("roundId", "participantId");

-- Recreate Vote with roundId
CREATE TABLE "Vote_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roundId" TEXT NOT NULL,
    "voterParticipantId" TEXT NOT NULL,
    "targetParticipantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vote_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "Vote_new" ("id", "roundId", "voterParticipantId", "targetParticipantId", "createdAt")
SELECT v."id", r."id", v."voterParticipantId", v."targetParticipantId", v."createdAt"
FROM "Vote" v
JOIN "Participant" part ON part."id" = v."voterParticipantId"
JOIN "Round" r ON r."sessionId" = part."sessionId" AND r."number" = 1;

DROP TABLE "Vote";
ALTER TABLE "Vote_new" RENAME TO "Vote";

CREATE UNIQUE INDEX "Vote_roundId_voterParticipantId_key" ON "Vote"("roundId", "voterParticipantId");
CREATE INDEX "Vote_roundId_idx" ON "Vote"("roundId");

-- Migrate SessionResult to RoundResult for completed sessions
INSERT INTO "RoundResult" ("id", "roundId", "data", "createdAt")
SELECT lower(hex(randomblob(12))), r."id", sr."data", sr."createdAt"
FROM "SessionResult" sr
JOIN "Round" r ON r."sessionId" = sr."sessionId" AND r."number" = 1;

-- Drop legacy columns from Session
CREATE TABLE "Session_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'setup',
    "currentRoundNumber" INTEGER NOT NULL DEFAULT 1,
    "creatorParticipantId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "Session_new" ("id", "code", "title", "status", "currentRoundNumber", "creatorParticipantId", "createdAt")
SELECT "id", "code", "title", "status", "currentRoundNumber", "creatorParticipantId", "createdAt"
FROM "Session";

DROP TABLE "Session";
ALTER TABLE "Session_new" RENAME TO "Session";

CREATE UNIQUE INDEX "Session_code_key" ON "Session"("code");

CREATE UNIQUE INDEX "Round_sessionId_number_key" ON "Round"("sessionId", "number");
CREATE INDEX "Round_sessionId_idx" ON "Round"("sessionId");
CREATE UNIQUE INDEX "RoundResult_roundId_key" ON "RoundResult"("roundId");
