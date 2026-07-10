-- AlterTable
ALTER TABLE "Session" ADD COLUMN "creatorParticipantId" TEXT;
ALTER TABLE "Session" ADD COLUMN "listAliases" TEXT;

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "voterParticipantId" TEXT NOT NULL,
    "targetParticipantId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vote_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Vote_sessionId_idx" ON "Vote"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_sessionId_voterParticipantId_key" ON "Vote"("sessionId", "voterParticipantId");
