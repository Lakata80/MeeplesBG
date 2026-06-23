-- CreateTable
CREATE TABLE "Mechanic" (
    "id" TEXT NOT NULL,
    "bggId" INTEGER,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "descriptionEn" TEXT,
    "descriptionBg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mechanic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Mechanic_bggId_key" ON "Mechanic"("bggId");

-- CreateIndex
CREATE UNIQUE INDEX "Mechanic_slug_key" ON "Mechanic"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Mechanic_name_key" ON "Mechanic"("name");
