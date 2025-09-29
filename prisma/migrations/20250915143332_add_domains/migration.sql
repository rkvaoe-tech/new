-- CreateEnum
CREATE TYPE "public"."domain_request_status" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "public"."domain" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "is_assigned" BOOLEAN NOT NULL DEFAULT false,
    "assigned_to" TEXT,
    "assigned_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."domain_request" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "domain_id" TEXT,
    "status" "public"."domain_request_status" NOT NULL DEFAULT 'pending',
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "domain_domain_key" ON "public"."domain"("domain");

-- CreateIndex
CREATE INDEX "domain_is_assigned_idx" ON "public"."domain"("is_assigned");

-- CreateIndex
CREATE INDEX "domain_request_user_id_status_idx" ON "public"."domain_request"("user_id", "status");

-- CreateIndex
CREATE INDEX "domain_request_status_idx" ON "public"."domain_request"("status");

-- AddForeignKey
ALTER TABLE "public"."domain" ADD CONSTRAINT "domain_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."domain_request" ADD CONSTRAINT "domain_request_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."app_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."domain_request" ADD CONSTRAINT "domain_request_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "public"."domain"("id") ON DELETE SET NULL ON UPDATE CASCADE;
