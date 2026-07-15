-- CreateTable
CREATE TABLE "HotnessItem" (
    "rank" INTEGER NOT NULL,
    "bggId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "yearPublished" INTEGER,
    "thumbnailUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotnessItem_pkey" PRIMARY KEY ("rank")
);
