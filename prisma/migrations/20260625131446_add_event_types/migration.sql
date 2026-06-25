-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('TOURNAMENT', 'MEETUP', 'FESTIVAL', 'SHOP_EVENT');

-- AlterTable
ALTER TABLE "Thread" ADD COLUMN     "eventEndDate" TIMESTAMP(3),
ADD COLUMN     "eventType" "EventType";
