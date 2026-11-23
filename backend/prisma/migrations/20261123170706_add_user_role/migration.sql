-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PROPONENTE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'PROPONENTE';
