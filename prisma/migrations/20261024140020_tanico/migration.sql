/*
  Warnings:

  - You are about to drop the `Wishlist` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WishlistItem` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Wishlist" DROP CONSTRAINT "Wishlist_userId_fkey";

-- DropForeignKey
ALTER TABLE "WishlistItem" DROP CONSTRAINT "WishlistItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "WishlistItem" DROP CONSTRAINT "WishlistItem_wishlistId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "fulfillmentMethod" TEXT DEFAULT 'DELIVERY';

-- DropTable
DROP TABLE "Wishlist";

-- DropTable
DROP TABLE "WishlistItem";

-- CreateTable
CREATE TABLE "StockOpname" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "bookStock" DOUBLE PRECISION NOT NULL,
    "physicalStock" DOUBLE PRECISION NOT NULL,
    "difference" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockOpname_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockOpname_productId_idx" ON "StockOpname"("productId");

-- CreateIndex
CREATE INDEX "StockOpname_createdAt_idx" ON "StockOpname"("createdAt");

-- AddForeignKey
ALTER TABLE "StockOpname" ADD CONSTRAINT "StockOpname_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
