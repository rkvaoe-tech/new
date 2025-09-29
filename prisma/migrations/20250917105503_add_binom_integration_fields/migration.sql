-- AlterTable
ALTER TABLE "public"."app_user" ADD COLUMN     "binom_api_key" TEXT,
ADD COLUMN     "binom_url" TEXT,
ADD COLUMN     "binom_user_id" INTEGER;
