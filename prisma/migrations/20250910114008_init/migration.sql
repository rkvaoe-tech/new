-- CreateEnum
CREATE TYPE "public"."offer_status" AS ENUM ('active', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "public"."landing_type" AS ENUM ('landing', 'prelanding');

-- CreateTable
CREATE TABLE "public"."app_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."offer" (
    "id" TEXT NOT NULL,
    "vertical" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price_usd" INTEGER NOT NULL,
    "geo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "public"."offer_status" NOT NULL DEFAULT 'paused',
    "image_url" TEXT NOT NULL DEFAULT '',
    "ord" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."landing" (
    "id" TEXT NOT NULL,
    "offer_id" TEXT NOT NULL,
    "ext_id" INTEGER,
    "label" TEXT NOT NULL,
    "type" "public"."landing_type" NOT NULL,
    "locale" TEXT NOT NULL,
    "network_code" TEXT,
    "url" TEXT NOT NULL,
    "notes" TEXT,
    "ord" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."audit_log" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "diff" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_user_email_key" ON "public"."app_user"("email");

-- CreateIndex
CREATE INDEX "offer_status_idx" ON "public"."offer"("status");

-- CreateIndex
CREATE INDEX "offer_ord_idx" ON "public"."offer"("ord");

-- CreateIndex
CREATE INDEX "offer_geo_idx" ON "public"."offer"("geo");

-- CreateIndex
CREATE INDEX "offer_tags_idx" ON "public"."offer"("tags");

-- CreateIndex
CREATE INDEX "landing_offer_id_type_ord_idx" ON "public"."landing"("offer_id", "type", "ord");

-- CreateIndex
CREATE INDEX "landing_network_code_idx" ON "public"."landing"("network_code");

-- CreateIndex
CREATE INDEX "landing_locale_idx" ON "public"."landing"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "landing_offer_id_type_ext_id_key" ON "public"."landing"("offer_id", "type", "ext_id");

-- CreateIndex
CREATE INDEX "audit_log_created_at_idx" ON "public"."audit_log"("created_at");

-- AddForeignKey
ALTER TABLE "public"."landing" ADD CONSTRAINT "landing_offer_id_fkey" FOREIGN KEY ("offer_id") REFERENCES "public"."offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."audit_log" ADD CONSTRAINT "audit_log_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "public"."app_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
