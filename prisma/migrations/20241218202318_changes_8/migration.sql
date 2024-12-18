-- CreateTable
CREATE TABLE "ShopifyCustomCollection" (
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

    CONSTRAINT "ShopifyCustomCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyCustomCollection_collectionId_key" ON "ShopifyCustomCollection"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyCustomCollection_handle_key" ON "ShopifyCustomCollection"("handle");
