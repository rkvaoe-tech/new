-- AlterTable
ALTER TABLE "public"."domain" ADD COLUMN     "archived_at" TIMESTAMP(3),
ADD COLUMN     "is_archived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "domain_assigned_to_is_archived_idx" ON "public"."domain"("assigned_to", "is_archived");
