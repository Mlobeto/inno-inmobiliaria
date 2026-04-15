/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,status]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "enum_loteo_status" AS ENUM ('ACTIVO', 'INACTIVO', 'VENDIDO');

-- CreateEnum
CREATE TYPE "enum_lote_status" AS ENUM ('DISPONIBLE', 'RESERVADO', 'VENDIDO');

-- DropIndex
DROP INDEX "idx_subscriptions_active_per_tenant";

-- CreateTable
CREATE TABLE "loteos" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "totalLotes" INTEGER NOT NULL DEFAULT 0,
    "status" "enum_loteo_status" NOT NULL DEFAULT 'ACTIVO',
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loteos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes" (
    "id" SERIAL NOT NULL,
    "loteoId" INTEGER NOT NULL,
    "number" VARCHAR(50) NOT NULL,
    "surface" DOUBLE PRECISION,
    "price" DOUBLE PRECISION,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'ARS',
    "status" "enum_lote_status" NOT NULL DEFAULT 'DISPONIBLE',
    "description" TEXT,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_loteos_tenant" ON "loteos"("tenantId");

-- CreateIndex
CREATE INDEX "idx_lotes_loteo" ON "lotes"("loteoId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_subscriptions_active_per_tenant" ON "subscriptions"("tenantId", "status") WHERE ((status)::text = ANY ((ARRAY['trialing'::character varying, 'active'::character varying])::text[]));

-- AddForeignKey
ALTER TABLE "loteos" ADD CONSTRAINT "loteos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes" ADD CONSTRAINT "lotes_loteoId_fkey" FOREIGN KEY ("loteoId") REFERENCES "loteos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
