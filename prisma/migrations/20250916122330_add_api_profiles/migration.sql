-- CreateTable
CREATE TABLE "public"."api_profile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cloudflare_email" TEXT NOT NULL,
    "cloudflare_api_key" TEXT NOT NULL,
    "namecheap_api_user" TEXT NOT NULL,
    "namecheap_api_key" TEXT NOT NULL,
    "namecheap_username" TEXT NOT NULL,
    "client_ip" TEXT NOT NULL,
    "target_ip" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_profile_pkey" PRIMARY KEY ("id")
);
