/*
  Warnings:

  - You are about to drop the `ShopifyCustomCollection` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ShopifyCustomCollection";

-- CreateTable
CREATE TABLE "Shopify_CustomCollection" (
    "id" SERIAL NOT NULL,
    "collectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "handle" TEXT NOT NULL,
    "sortOrder" TEXT NOT NULL,
    "templateSuffix" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "adminGraphqlApiId" TEXT,
    "publishedScope" TEXT,
    "imageId" TEXT,
    "imageAlt" TEXT,
    "imageUrl" TEXT,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,

    CONSTRAINT "Shopify_CustomCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shopify_CustomCollection_collectionId_key" ON "Shopify_CustomCollection"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Shopify_CustomCollection_handle_key" ON "Shopify_CustomCollection"("handle");
