-- Needed for deterministic municipality name matching (accent/case-insensitive and trigram similarity).
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- AlterTable
ALTER TABLE "opportunities" ADD COLUMN     "covers_entire_state" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "opportunity_municipalities" (
    "id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "municipality_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "opportunity_municipalities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "opportunity_municipalities_opportunity_id_idx" ON "opportunity_municipalities"("opportunity_id");

-- CreateIndex
CREATE INDEX "opportunity_municipalities_municipality_id_idx" ON "opportunity_municipalities"("municipality_id");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_municipalities_opportunity_id_municipality_id_key" ON "opportunity_municipalities"("opportunity_id", "municipality_id");

-- AddForeignKey
ALTER TABLE "opportunity_municipalities" ADD CONSTRAINT "opportunity_municipalities_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_municipalities" ADD CONSTRAINT "opportunity_municipalities_municipality_id_fkey" FOREIGN KEY ("municipality_id") REFERENCES "municipalities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
