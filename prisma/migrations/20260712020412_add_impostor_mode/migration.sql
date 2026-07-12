-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "cardOptions" TEXT;

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "gameMode" TEXT NOT NULL DEFAULT 'ranking',
ADD COLUMN     "impostorParticipantId" TEXT,
ADD COLUMN     "impostorThemeId" TEXT;
