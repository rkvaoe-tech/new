-- CreateTable
CREATE TABLE "public"."vertical" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ord" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vertical_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."offer_type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ord" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."geo" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ord" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "geo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."language" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ord" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "language_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."partner" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "ord" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vertical_name_key" ON "public"."vertical"("name");

-- CreateIndex
CREATE INDEX "vertical_is_active_ord_idx" ON "public"."vertical"("is_active", "ord");

-- CreateIndex
CREATE UNIQUE INDEX "offer_type_name_key" ON "public"."offer_type"("name");

-- CreateIndex
CREATE INDEX "offer_type_is_active_ord_idx" ON "public"."offer_type"("is_active", "ord");

-- CreateIndex
CREATE UNIQUE INDEX "geo_code_key" ON "public"."geo"("code");

-- CreateIndex
CREATE INDEX "geo_is_active_ord_idx" ON "public"."geo"("is_active", "ord");

-- CreateIndex
CREATE UNIQUE INDEX "language_code_key" ON "public"."language"("code");

-- CreateIndex
CREATE INDEX "language_is_active_ord_idx" ON "public"."language"("is_active", "ord");

-- CreateIndex
CREATE UNIQUE INDEX "partner_code_key" ON "public"."partner"("code");

-- CreateIndex
CREATE INDEX "partner_is_active_ord_idx" ON "public"."partner"("is_active", "ord");
