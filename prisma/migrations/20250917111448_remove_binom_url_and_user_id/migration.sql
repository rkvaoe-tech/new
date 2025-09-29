/*
  Warnings:

  - You are about to drop the column `binom_url` on the `app_user` table. All the data in the column will be lost.
  - You are about to drop the column `binom_user_id` on the `app_user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."app_user" DROP COLUMN "binom_url",
DROP COLUMN "binom_user_id";
