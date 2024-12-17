/*
  Warnings:

  - Added the required column `inventoryPolicy` to the `Variant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Variant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "inventoryItemId" TEXT,
ADD COLUMN     "inventoryPolicy" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "vendor" TEXT NOT NULL,
    "productType" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tags" TEXT,
    "templateSuffix" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_productId_key" ON "Product"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_handle_key" ON "Product"("handle");

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantProduct" ADD CONSTRAINT "VariantProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
