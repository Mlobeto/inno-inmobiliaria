/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,status]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "enum_leads_status" AS ENUM ('NUEVO', 'CONTACTADO', 'EN_SEGUIMIENTO', 'CERRADO_GANADO', 'CERRADO_PERDIDO');

-- DropIndex
DROP INDEX "idx_subscriptions_active_per_tenant";

-- CreateTable
CREATE TABLE "leads" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "email" VARCHAR(255),
    "operationType" VARCHAR(50),
    "budget" DECIMAL(12,2),
    "currency" VARCHAR(3) DEFAULT 'ARS',
    "zone" VARCHAR(255),
    "notes" TEXT,
    "status" "enum_leads_status" NOT NULL DEFAULT 'NUEVO',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_leads_tenant" ON "leads"("tenantId");

-- CreateIndex
CREATE INDEX "idx_leads_status" ON "leads"("status");

-- CreateIndex
CREATE UNIQUE INDEX "idx_subscriptions_active_per_tenant" ON "subscriptions"("tenantId", "status") WHERE ((status)::text = ANY ((ARRAY['trialing'::character varying, 'active'::character varying])::text[]));

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;
