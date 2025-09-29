/*
  Warnings:

  - Added the required column `password_hash` to the `app_user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable - Add column with temporary default value
ALTER TABLE "public"."app_user" ADD COLUMN "password_hash" TEXT NOT NULL DEFAULT 'temp';

-- Update existing users with hashed passwords
-- Admin users get 'admin' password
-- Regular users get 'user' password

UPDATE "public"."app_user" 
SET "password_hash" = '$2b$12$yHwL4neVR8UCAL94y40/WO7AqBCf4YnxrvDna0YfYdnDAPAuumFyu'
WHERE "role" = 'ADMIN';

UPDATE "public"."app_user" 
SET "password_hash" = '$2b$12$ZSj6oBRO/6cRfFiSzkC4T.dDU88aBOWYVi0HU.8BvzNSaE.7dNcJ6'
WHERE "role" = 'USER';

-- Remove the default constraint
ALTER TABLE "public"."app_user" ALTER COLUMN "password_hash" DROP DEFAULT;
