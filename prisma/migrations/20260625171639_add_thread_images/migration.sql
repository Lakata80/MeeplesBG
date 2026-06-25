-- AlterTable
ALTER TABLE "Thread" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
