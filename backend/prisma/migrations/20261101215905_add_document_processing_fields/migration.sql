-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "error_message" TEXT,
ADD COLUMN     "needs_ocr" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "page_count" INTEGER;
