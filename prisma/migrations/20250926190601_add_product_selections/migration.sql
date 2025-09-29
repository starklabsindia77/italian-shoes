-- DropForeignKey
ALTER TABLE "public"."OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductImage" DROP CONSTRAINT "ProductImage_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductOption" DROP CONSTRAINT "ProductOption_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductPanel" DROP CONSTRAINT "ProductPanel_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductSize" DROP CONSTRAINT "ProductSize_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductSole" DROP CONSTRAINT "ProductSole_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductStyle" DROP CONSTRAINT "ProductStyle_productId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductVariant" DROP CONSTRAINT "ProductVariant_productId_fkey";

-- AlterTable
ALTER TABLE "public"."Product" ADD COLUMN     "selectedMaterials" JSONB,
ADD COLUMN     "selectedSoles" JSONB,
ADD COLUMN     "selectedStyles" JSONB;
