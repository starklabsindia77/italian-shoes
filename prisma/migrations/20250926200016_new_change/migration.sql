/*
  Warnings:

  - You are about to drop the `ProductImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductOption` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductOptionValue` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductPanel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductPanelColor` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductSize` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductSole` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductStyle` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductVariant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductVariantOption` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."OrderItem" DROP CONSTRAINT "OrderItem_productVariantId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductOptionValue" DROP CONSTRAINT "ProductOptionValue_productOptionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductPanel" DROP CONSTRAINT "ProductPanel_defaultMaterialColorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductPanel" DROP CONSTRAINT "ProductPanel_panelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductPanelColor" DROP CONSTRAINT "ProductPanelColor_materialColorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductPanelColor" DROP CONSTRAINT "ProductPanelColor_productPanelId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductSize" DROP CONSTRAINT "ProductSize_sizeId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductSole" DROP CONSTRAINT "ProductSole_soleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductStyle" DROP CONSTRAINT "ProductStyle_styleId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductVariantOption" DROP CONSTRAINT "ProductVariantOption_productOptionId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductVariantOption" DROP CONSTRAINT "ProductVariantOption_productOptionValueId_fkey";

-- DropForeignKey
ALTER TABLE "public"."ProductVariantOption" DROP CONSTRAINT "ProductVariantOption_productVariantId_fkey";

-- DropTable
DROP TABLE "public"."ProductImage";

-- DropTable
DROP TABLE "public"."ProductOption";

-- DropTable
DROP TABLE "public"."ProductOptionValue";

-- DropTable
DROP TABLE "public"."ProductPanel";

-- DropTable
DROP TABLE "public"."ProductPanelColor";

-- DropTable
DROP TABLE "public"."ProductSize";

-- DropTable
DROP TABLE "public"."ProductSole";

-- DropTable
DROP TABLE "public"."ProductStyle";

-- DropTable
DROP TABLE "public"."ProductVariant";

-- DropTable
DROP TABLE "public"."ProductVariantOption";
