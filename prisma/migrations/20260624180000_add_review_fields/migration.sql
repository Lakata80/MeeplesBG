-- AlterTable
ALTER TABLE "Review" ADD COLUMN "audience" TEXT,
ADD COLUMN "playedWith" TEXT,
ADD COLUMN "realPlaytime" INTEGER;

-- AlterTable: set isPublished default to true
ALTER TABLE "Review" ALTER COLUMN "isPublished" SET DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Review_userId_gameId_key" ON "Review"("userId", "gameId");
