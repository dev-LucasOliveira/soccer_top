-- CreateTable
CREATE TABLE "RankingMeta" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RankingMeta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RankingMeta_roundId_idx" ON "RankingMeta"("roundId");

-- CreateIndex
CREATE UNIQUE INDEX "RankingMeta_roundId_participantId_key" ON "RankingMeta"("roundId", "participantId");

-- AddForeignKey
ALTER TABLE "RankingMeta" ADD CONSTRAINT "RankingMeta_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankingMeta" ADD CONSTRAINT "RankingMeta_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
