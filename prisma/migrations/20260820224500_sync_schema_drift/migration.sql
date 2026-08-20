-- Sync migration: schema.prisma drifted ahead of the migration history
-- while deploys were broken (Jul-Aug 2026) and production received these
-- changes via `db push`. Every statement is IDEMPOTENT on purpose:
-- production already has most of these objects, while a fresh database
-- built from the migration history has none of them. This migration
-- brings BOTH to the same place.

DROP INDEX IF EXISTS "Size_id_key";
DROP INDEX IF EXISTS "Sole_id_key";
DROP INDEX IF EXISTS "Style_id_key";

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingMethodId" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingMethodName" TEXT;

-- glbUrl/thumbnailUrl left the Product model. Dropping loses those two
-- columns' values: accepted, and recoverable from the pre-migration
-- dump/snapshot if ever needed.
ALTER TABLE "Product" DROP COLUMN IF EXISTS "glbUrl";
ALTER TABLE "Product" DROP COLUMN IF EXISTS "thumbnailUrl";

-- New required business identifiers: add nullable, backfill from the
-- primary key so existing rows satisfy NOT NULL + UNIQUE, then tighten.
ALTER TABLE "Size" ADD COLUMN IF NOT EXISTS "sizeId" TEXT;
UPDATE "Size" SET "sizeId" = "id" WHERE "sizeId" IS NULL;
ALTER TABLE "Size" ALTER COLUMN "sizeId" SET NOT NULL;

ALTER TABLE "Sole" ADD COLUMN IF NOT EXISTS "soleId" TEXT;
UPDATE "Sole" SET "soleId" = "id" WHERE "soleId" IS NULL;
ALTER TABLE "Sole" ALTER COLUMN "soleId" SET NOT NULL;

ALTER TABLE "Style" ADD COLUMN IF NOT EXISTS "styleId" TEXT;
UPDATE "Style" SET "styleId" = "id" WHERE "styleId" IS NULL;
ALTER TABLE "Style" ALTER COLUMN "styleId" SET NOT NULL;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "customRoleId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "customerId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;

CREATE TABLE IF NOT EXISTS "CustomRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CustomRole_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomRole_name_key" ON "CustomRole"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "Size_sizeId_key" ON "Size"("sizeId");
CREATE UNIQUE INDEX IF NOT EXISTS "Sole_soleId_key" ON "Sole"("soleId");
CREATE UNIQUE INDEX IF NOT EXISTS "Style_styleId_key" ON "Style"("styleId");
CREATE UNIQUE INDEX IF NOT EXISTS "User_customerId_key" ON "User"("customerId");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_customRoleId_fkey') THEN
    ALTER TABLE "User" ADD CONSTRAINT "User_customRoleId_fkey"
      FOREIGN KEY ("customRoleId") REFERENCES "CustomRole"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
