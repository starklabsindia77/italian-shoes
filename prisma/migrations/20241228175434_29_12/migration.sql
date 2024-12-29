/*
  Warnings:

  - You are about to drop the column `variantId` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `variantId` on the `SizeOption` table. All the data in the column will be lost.
  - You are about to drop the column `variantId` on the `StyleOption` table. All the data in the column will be lost.
  - You are about to drop the column `inventoryItemId` on the `Variant` table. All the data in the column will be lost.
  - You are about to drop the column `inventoryPolicy` on the `Variant` table. All the data in the column will be lost.
  - You are about to drop the column `inventoryQuantity` on the `Variant` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Variant` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `Variant` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `Variant` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Variant` table. All the data in the column will be lost.
  - You are about to drop the column `variantId` on the `Variant` table. All the data in the column will be lost.
  - You are about to drop the `Customization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `MaterialOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VariantProduct` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `productVariantId` to the `Image` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Customization" DROP CONSTRAINT "Customization_variantId_fkey";

-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_variantId_fkey";

-- DropForeignKey
ALTER TABLE "MaterialOption" DROP CONSTRAINT "MaterialOption_variantId_fkey";

-- DropForeignKey
ALTER TABLE "SizeOption" DROP CONSTRAINT "SizeOption_variantId_fkey";

-- DropForeignKey
ALTER TABLE "StyleOption" DROP CONSTRAINT "StyleOption_variantId_fkey";

-- DropForeignKey
ALTER TABLE "Variant" DROP CONSTRAINT "Variant_productId_fkey";

-- DropForeignKey
ALTER TABLE "VariantProduct" DROP CONSTRAINT "VariantProduct_productId_fkey";

-- DropIndex
DROP INDEX "Variant_sku_key";

-- DropIndex
DROP INDEX "Variant_variantId_key";

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "variantId",
ADD COLUMN     "altText" TEXT,
ADD COLUMN     "productVariantId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "SizeOption" DROP COLUMN "variantId";

-- AlterTable
ALTER TABLE "StyleOption" DROP COLUMN "variantId",
ALTER COLUMN "imageUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Variant" DROP COLUMN "inventoryItemId",
DROP COLUMN "inventoryPolicy",
DROP COLUMN "inventoryQuantity",
DROP COLUMN "price",
DROP COLUMN "productId",
DROP COLUMN "sku",
DROP COLUMN "title",
DROP COLUMN "variantId",
ADD COLUMN     "colorId" INTEGER,
ADD COLUMN     "materialId" INTEGER,
ADD COLUMN     "panelId" INTEGER,
ADD COLUMN     "sizeOptionId" INTEGER,
ADD COLUMN     "soleOptionId" INTEGER,
ADD COLUMN     "styleOptionId" INTEGER;

-- DropTable
DROP TABLE "Customization";

-- DropTable
DROP TABLE "MaterialOption";

-- DropTable
DROP TABLE "VariantProduct";

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" SERIAL NOT NULL,
    "productId" INTEGER NOT NULL,
    "variantId" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "inventoryQuantity" INTEGER NOT NULL DEFAULT 0,
    "seoMetadataId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SEO" (
    "id" SERIAL NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "keywords" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SEO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SoleOption" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "height" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SoleOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Color" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "hexCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Color_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Panel" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Panel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_seoMetadataId_fkey" FOREIGN KEY ("seoMetadataId") REFERENCES "SEO"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_sizeOptionId_fkey" FOREIGN KEY ("sizeOptionId") REFERENCES "SizeOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_styleOptionId_fkey" FOREIGN KEY ("styleOptionId") REFERENCES "StyleOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_soleOptionId_fkey" FOREIGN KEY ("soleOptionId") REFERENCES "SoleOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "Panel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
