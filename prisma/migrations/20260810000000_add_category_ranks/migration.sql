-- Add BGG category-specific rank fields to Game
ALTER TABLE "Game" ADD COLUMN "bggWargamesRank" INTEGER;
ALTER TABLE "Game" ADD COLUMN "bggStrategyRank" INTEGER;
ALTER TABLE "Game" ADD COLUMN "bggFamilyRank" INTEGER;
