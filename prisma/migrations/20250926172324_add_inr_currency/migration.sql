-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."Currency" AS ENUM ('USD', 'EUR', 'GBP', 'INR');

-- CreateEnum
CREATE TYPE "public"."Region" AS ENUM ('US', 'EU', 'UK');

-- CreateEnum
CREATE TYPE "public"."PanelGroup" AS ENUM ('FRONT', 'SIDE', 'BACK', 'TOP', 'SOLE', 'LINING');

-- CreateEnum
CREATE TYPE "public"."OrderStatus" AS ENUM ('DESIGN_RECEIVED', 'IN_PRODUCTION', 'QUALITY_CHECK', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "public"."FulfillmentStatus" AS ENUM ('UNFULFILLED', 'IN_PRODUCTION', 'READY_TO_SHIP', 'SHIPPED', 'DELIVERED');

-- CreateEnum
CREATE TYPE "public"."ShipmentStatus" AS ENUM ('PENDING', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."ShoeWidth" AS ENUM ('STANDARD', 'WIDE', 'EXTRA_WIDE', 'NARROW');

-- CreateEnum
CREATE TYPE "public"."OptionType" AS ENUM ('SIZE', 'WIDTH', 'STYLE', 'SOLE', 'COLOR', 'MATERIAL', 'CUSTOM');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "role" "public"."Role" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."Material" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "extId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MaterialColor" (
    "id" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "colorCode" TEXT,
    "family" TEXT,
    "hexCode" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "extId" INTEGER,

    CONSTRAINT "MaterialColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Style" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "glbUrl" TEXT,
    "lighting" JSONB,
    "environment" JSONB,
    "assets" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Style_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Sole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT,
    "glbUrl" TEXT,
    "lighting" JSONB,
    "environment" JSONB,
    "assets" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Size" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" "public"."Region" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "euEquivalent" TEXT,
    "ukEquivalent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "extId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Size_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Panel" (
    "id" TEXT NOT NULL,
    "panelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group" "public"."PanelGroup",
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Panel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Product" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "vendor" TEXT,
    "description" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "price" INTEGER NOT NULL,
    "currency" "public"."Currency" NOT NULL DEFAULT 'INR',
    "compareAtPrice" INTEGER,
    "assets" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductStyle" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "styleId" TEXT NOT NULL,

    CONSTRAINT "ProductStyle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductSole" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "soleId" TEXT NOT NULL,

    CONSTRAINT "ProductSole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductSize" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sizeId" TEXT NOT NULL,
    "width" "public"."ShoeWidth" NOT NULL DEFAULT 'STANDARD',

    CONSTRAINT "ProductSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductPanel" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "panelId" TEXT NOT NULL,
    "isCustomizable" BOOLEAN NOT NULL DEFAULT true,
    "modelUrl" TEXT,
    "defaultMaterialColorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductPanel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductPanelColor" (
    "id" TEXT NOT NULL,
    "productPanelId" TEXT NOT NULL,
    "materialColorId" TEXT NOT NULL,

    CONSTRAINT "ProductPanelColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductOption" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."OptionType" NOT NULL DEFAULT 'CUSTOM',
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,

    CONSTRAINT "ProductOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductOptionValue" (
    "id" TEXT NOT NULL,
    "productOptionId" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "sizeId" TEXT,
    "styleId" TEXT,
    "soleId" TEXT,
    "materialColorId" TEXT,
    "width" "public"."ShoeWidth",

    CONSTRAINT "ProductOptionValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "price" INTEGER NOT NULL,
    "currency" "public"."Currency" NOT NULL DEFAULT 'USD',
    "compareAt" INTEGER,
    "stockQty" INTEGER,
    "weightGrams" INTEGER,
    "imageUrl" TEXT,
    "metadata" JSONB,
    "optionsHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProductVariantOption" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "productOptionId" TEXT NOT NULL,
    "productOptionValueId" TEXT NOT NULL,

    CONSTRAINT "ProductVariantOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Order" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" TEXT,
    "customerEmail" TEXT NOT NULL,
    "customerFirstName" TEXT,
    "customerLastName" TEXT,
    "customerPhone" TEXT,
    "isGuest" BOOLEAN NOT NULL DEFAULT false,
    "shippingAddress" JSONB NOT NULL,
    "billingAddress" JSONB NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "tax" INTEGER NOT NULL,
    "shippingAmount" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "currency" "public"."Currency" NOT NULL DEFAULT 'USD',
    "status" "public"."OrderStatus" NOT NULL DEFAULT 'DESIGN_RECEIVED',
    "paymentStatus" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "fulfillmentStatus" "public"."FulfillmentStatus" NOT NULL DEFAULT 'UNFULFILLED',
    "estimatedProductionTime" INTEGER NOT NULL DEFAULT 0,
    "actualProductionTime" INTEGER,
    "productionStartDate" TIMESTAMP(3),
    "productionEndDate" TIMESTAMP(3),
    "qualityCheckDate" TIMESTAMP(3),
    "manufacturingNotes" TEXT,
    "designReceivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productionStartedAt" TIMESTAMP(3),
    "productionCompletedAt" TIMESTAMP(3),
    "shippedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "productTitle" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "productVariantId" TEXT,
    "styleId" TEXT,
    "soleId" TEXT,
    "sizeId" TEXT,
    "panelCustomization" JSONB NOT NULL,
    "designGlbUrl" TEXT,
    "designThumbnail" TEXT,
    "designConfig" JSONB,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OrderShipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'shiprocket',
    "providerOrderId" TEXT,
    "awbNumber" TEXT,
    "courierName" TEXT,
    "courierId" TEXT,
    "trackingUrl" TEXT,
    "labelUrl" TEXT,
    "status" "public"."ShipmentStatus" NOT NULL DEFAULT 'PENDING',
    "estimatedDelivery" TIMESTAMP(3),
    "actualDelivery" TIMESTAMP(3),

    CONSTRAINT "OrderShipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "public"."Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "public"."Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "public"."VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "public"."VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Material_id_key" ON "public"."Material"("id");

-- CreateIndex
CREATE INDEX "MaterialColor_materialId_idx" ON "public"."MaterialColor"("materialId");

-- CreateIndex
CREATE INDEX "MaterialColor_name_idx" ON "public"."MaterialColor"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Style_id_key" ON "public"."Style"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Sole_id_key" ON "public"."Sole"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Size_id_key" ON "public"."Size"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Panel_panelId_key" ON "public"."Panel"("panelId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_productId_key" ON "public"."Product"("productId");

-- CreateIndex
CREATE INDEX "Product_title_idx" ON "public"."Product"("title");

-- CreateIndex
CREATE INDEX "Product_productId_idx" ON "public"."Product"("productId");

-- CreateIndex
CREATE INDEX "ProductImage_productId_idx" ON "public"."ProductImage"("productId");

-- CreateIndex
CREATE INDEX "ProductStyle_styleId_idx" ON "public"."ProductStyle"("styleId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductStyle_productId_styleId_key" ON "public"."ProductStyle"("productId", "styleId");

-- CreateIndex
CREATE INDEX "ProductSole_soleId_idx" ON "public"."ProductSole"("soleId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSole_productId_soleId_key" ON "public"."ProductSole"("productId", "soleId");

-- CreateIndex
CREATE INDEX "ProductSize_sizeId_idx" ON "public"."ProductSize"("sizeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductSize_productId_sizeId_width_key" ON "public"."ProductSize"("productId", "sizeId", "width");

-- CreateIndex
CREATE INDEX "ProductPanel_panelId_idx" ON "public"."ProductPanel"("panelId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPanel_productId_panelId_key" ON "public"."ProductPanel"("productId", "panelId");

-- CreateIndex
CREATE INDEX "ProductPanelColor_materialColorId_idx" ON "public"."ProductPanelColor"("materialColorId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPanelColor_productPanelId_materialColorId_key" ON "public"."ProductPanelColor"("productPanelId", "materialColorId");

-- CreateIndex
CREATE INDEX "ProductOption_productId_idx" ON "public"."ProductOption"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductOption_productId_code_key" ON "public"."ProductOption"("productId", "code");

-- CreateIndex
CREATE INDEX "ProductOptionValue_productOptionId_idx" ON "public"."ProductOptionValue"("productOptionId");

-- CreateIndex
CREATE INDEX "ProductOptionValue_materialColorId_idx" ON "public"."ProductOptionValue"("materialColorId");

-- CreateIndex
CREATE INDEX "ProductOptionValue_sizeId_idx" ON "public"."ProductOptionValue"("sizeId");

-- CreateIndex
CREATE INDEX "ProductOptionValue_styleId_idx" ON "public"."ProductOptionValue"("styleId");

-- CreateIndex
CREATE INDEX "ProductOptionValue_soleId_idx" ON "public"."ProductOptionValue"("soleId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductOptionValue_productOptionId_value_key" ON "public"."ProductOptionValue"("productOptionId", "value");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "public"."ProductVariant"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_barcode_key" ON "public"."ProductVariant"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_optionsHash_key" ON "public"."ProductVariant"("optionsHash");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "public"."ProductVariant"("productId");

-- CreateIndex
CREATE INDEX "ProductVariantOption_productOptionValueId_idx" ON "public"."ProductVariantOption"("productOptionValueId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariantOption_productVariantId_productOptionId_key" ON "public"."ProductVariantOption"("productVariantId", "productOptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderId_key" ON "public"."Order"("orderId");

-- CreateIndex
CREATE INDEX "Order_customerEmail_idx" ON "public"."Order"("customerEmail");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "public"."Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "OrderItem_orderId_idx" ON "public"."OrderItem"("orderId");

-- CreateIndex
CREATE INDEX "OrderItem_productId_idx" ON "public"."OrderItem"("productId");

-- CreateIndex
CREATE INDEX "OrderItem_productVariantId_idx" ON "public"."OrderItem"("productVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderShipment_orderId_key" ON "public"."OrderShipment"("orderId");

-- AddForeignKey
ALTER TABLE "public"."Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaterialColor" ADD CONSTRAINT "MaterialColor_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "public"."Material"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductStyle" ADD CONSTRAINT "ProductStyle_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductStyle" ADD CONSTRAINT "ProductStyle_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "public"."Style"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductSole" ADD CONSTRAINT "ProductSole_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductSole" ADD CONSTRAINT "ProductSole_soleId_fkey" FOREIGN KEY ("soleId") REFERENCES "public"."Sole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductSize" ADD CONSTRAINT "ProductSize_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductSize" ADD CONSTRAINT "ProductSize_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "public"."Size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductPanel" ADD CONSTRAINT "ProductPanel_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductPanel" ADD CONSTRAINT "ProductPanel_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "public"."Panel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductPanel" ADD CONSTRAINT "ProductPanel_defaultMaterialColorId_fkey" FOREIGN KEY ("defaultMaterialColorId") REFERENCES "public"."MaterialColor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductPanelColor" ADD CONSTRAINT "ProductPanelColor_productPanelId_fkey" FOREIGN KEY ("productPanelId") REFERENCES "public"."ProductPanel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductPanelColor" ADD CONSTRAINT "ProductPanelColor_materialColorId_fkey" FOREIGN KEY ("materialColorId") REFERENCES "public"."MaterialColor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductOption" ADD CONSTRAINT "ProductOption_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductOptionValue" ADD CONSTRAINT "ProductOptionValue_productOptionId_fkey" FOREIGN KEY ("productOptionId") REFERENCES "public"."ProductOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariantOption" ADD CONSTRAINT "ProductVariantOption_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "public"."ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariantOption" ADD CONSTRAINT "ProductVariantOption_productOptionId_fkey" FOREIGN KEY ("productOptionId") REFERENCES "public"."ProductOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProductVariantOption" ADD CONSTRAINT "ProductVariantOption_productOptionValueId_fkey" FOREIGN KEY ("productOptionValueId") REFERENCES "public"."ProductOptionValue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "public"."ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_styleId_fkey" FOREIGN KEY ("styleId") REFERENCES "public"."Style"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_soleId_fkey" FOREIGN KEY ("soleId") REFERENCES "public"."Sole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_sizeId_fkey" FOREIGN KEY ("sizeId") REFERENCES "public"."Size"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OrderShipment" ADD CONSTRAINT "OrderShipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
