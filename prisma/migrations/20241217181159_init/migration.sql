-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "activity" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyCollection" (
    "id" SERIAL NOT NULL,
    "collectionId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "publishedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "sortOrder" TEXT NOT NULL,
    "templateSuffix" TEXT,
    "productsCount" INTEGER NOT NULL DEFAULT 0,
    "collectionType" TEXT NOT NULL,
    "publishedScope" TEXT NOT NULL,
    "adminGraphqlApiId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAtField" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variant" (
    "id" SERIAL NOT NULL,
    "variantId" TEXT NOT NULL,
    "sku" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "productId" INTEGER NOT NULL,
    "inventoryQuantity" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariantProduct" (
    "id" SERIAL NOT NULL,
    "variantId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VariantProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyCollect" (
    "id" SERIAL NOT NULL,
    "collectId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "sortValue" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3),
    "createdAtField" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopifyCollect_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyProduct" (
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
    "adminGraphqlApiId" TEXT,
    "publishedScope" TEXT,
    "imageId" TEXT,
    "imageUrl" TEXT,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,

    CONSTRAINT "ShopifyProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyVariant" (
    "id" SERIAL NOT NULL,
    "variantId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "sku" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "inventoryQuantity" INTEGER NOT NULL DEFAULT 0,
    "inventoryPolicy" TEXT NOT NULL,
    "barcode" TEXT,
    "weight" DOUBLE PRECISION NOT NULL,
    "weightUnit" TEXT NOT NULL,
    "inventoryItemId" TEXT,
    "fulfillmentService" TEXT,
    "inventoryManagement" TEXT,
    "taxable" BOOLEAN NOT NULL DEFAULT true,
    "requiresShipping" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyImage" (
    "id" SERIAL NOT NULL,
    "imageId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "src" TEXT NOT NULL,
    "alt" TEXT,
    "position" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyCollection_collectionId_key" ON "ShopifyCollection"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_variantId_key" ON "Variant"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "Variant_sku_key" ON "Variant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyCollect_collectId_key" ON "ShopifyCollect"("collectId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyProduct_productId_key" ON "ShopifyProduct"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyProduct_handle_key" ON "ShopifyProduct"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyVariant_variantId_key" ON "ShopifyVariant"("variantId");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyVariant_sku_key" ON "ShopifyVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyImage_imageId_key" ON "ShopifyImage"("imageId");

-- AddForeignKey
ALTER TABLE "UserLog" ADD CONSTRAINT "UserLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantProduct" ADD CONSTRAINT "VariantProduct_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyVariant" ADD CONSTRAINT "ShopifyVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopifyProduct"("productId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopifyImage" ADD CONSTRAINT "ShopifyImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ShopifyProduct"("productId") ON DELETE CASCADE ON UPDATE CASCADE;
