/*
  Warnings:

  - You are about to drop the column `productId` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[handle]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `handle` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productType` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shopifyProductId` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vendor` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProductVariant" DROP CONSTRAINT "ProductVariant_productId_fkey";

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "productId",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "handle" TEXT NOT NULL,
ADD COLUMN     "productType" TEXT NOT NULL,
ADD COLUMN     "publishedAt" TIMESTAMP(3),
ADD COLUMN     "shopifyProductId" INTEGER NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL,
ADD COLUMN     "tags" TEXT,
ADD COLUMN     "templateSuffix" TEXT,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "vendor" TEXT NOT NULL;

-- DropTable
DROP TABLE "Product";

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_handle_key" ON "ProductVariant"("handle");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_shopifyProductId_fkey" FOREIGN KEY ("shopifyProductId") REFERENCES "ShopifyProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;
