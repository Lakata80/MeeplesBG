-- CreateEnum
CREATE TYPE "PlayVisibility" AS ENUM ('PRIVATE', 'PUBLIC');

-- CreateTable
CREATE TABLE "GamePlay" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMinutes" INTEGER,
    "notes" TEXT,
    "visibility" "PlayVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamePlay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamePlayPlayer" (
    "id" TEXT NOT NULL,
    "playId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT,
    "score" INTEGER,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GamePlayPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GamePlay_gameId_idx" ON "GamePlay"("gameId");

-- CreateIndex
CREATE INDEX "GamePlay_userId_idx" ON "GamePlay"("userId");

-- CreateIndex
CREATE INDEX "GamePlayPlayer_playId_idx" ON "GamePlayPlayer"("playId");

-- AddForeignKey
ALTER TABLE "GamePlay" ADD CONSTRAINT "GamePlay_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlay" ADD CONSTRAINT "GamePlay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayPlayer" ADD CONSTRAINT "GamePlayPlayer_playId_fkey" FOREIGN KEY ("playId") REFERENCES "GamePlay"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayPlayer" ADD CONSTRAINT "GamePlayPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
