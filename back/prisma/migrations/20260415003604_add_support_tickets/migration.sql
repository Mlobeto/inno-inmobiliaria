/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,status]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "enum_ticket_category" AS ENUM ('BUG', 'CONSULTA', 'FACTURACION', 'MEJORA', 'OTRO');

-- CreateEnum
CREATE TYPE "enum_ticket_priority" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "enum_ticket_status" AS ENUM ('ABIERTO', 'EN_PROGRESO', 'RESUELTO', 'CERRADO');

-- DropIndex
DROP INDEX "idx_subscriptions_active_per_tenant";

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "enum_ticket_category" NOT NULL DEFAULT 'CONSULTA',
    "priority" "enum_ticket_priority" NOT NULL DEFAULT 'MEDIA',
    "status" "enum_ticket_status" NOT NULL DEFAULT 'ABIERTO',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "authorRole" VARCHAR(20) NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_tickets_tenant" ON "support_tickets"("tenantId");

-- CreateIndex
CREATE INDEX "idx_tickets_status" ON "support_tickets"("status");

-- CreateIndex
CREATE INDEX "idx_tickets_created" ON "support_tickets"("createdAt");

-- CreateIndex
CREATE INDEX "idx_ticket_messages_ticket" ON "ticket_messages"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_subscriptions_active_per_tenant" ON "subscriptions"("tenantId", "status") WHERE ((status)::text = ANY ((ARRAY['trialing'::character varying, 'active'::character varying])::text[]));

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
