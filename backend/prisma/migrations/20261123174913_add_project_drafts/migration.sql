-- CreateEnum
CREATE TYPE "ProjectDraftSectionKey" AS ENUM ('JUSTIFICATIVA', 'OBJETIVOS', 'CONTRAPARTIDAS', 'ORCAMENTO');

-- CreateTable
CREATE TABLE "project_drafts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "opportunity_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_draft_sections" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "section" "ProjectDraftSectionKey" NOT NULL,
    "answers" JSONB,
    "generated_text" TEXT,
    "regeneration_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_draft_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_draft_questions" (
    "id" TEXT NOT NULL,
    "draft_id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_draft_questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_drafts_user_id_opportunity_id_key" ON "project_drafts"("user_id", "opportunity_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_draft_sections_draft_id_section_key" ON "project_draft_sections"("draft_id", "section");

-- CreateIndex
CREATE INDEX "project_draft_questions_draft_id_idx" ON "project_draft_questions"("draft_id");

-- AddForeignKey
ALTER TABLE "project_drafts" ADD CONSTRAINT "project_drafts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_drafts" ADD CONSTRAINT "project_drafts_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_draft_sections" ADD CONSTRAINT "project_draft_sections_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "project_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_draft_questions" ADD CONSTRAINT "project_draft_questions_draft_id_fkey" FOREIGN KEY ("draft_id") REFERENCES "project_drafts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
