/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,status]` on the table `subscriptions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TemporaryRentalBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "TemporaryRentalPaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "commissions" DROP CONSTRAINT "commissions_propertyId_fkey";

-- DropIndex
DROP INDEX "idx_subscriptions_active_per_tenant";

-- AlterTable
ALTER TABLE "commissions" ADD COLUMN     "loteVentaId" INTEGER,
ADD COLUMN     "loteoNombre" VARCHAR(200),
ALTER COLUMN "propertyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "loteos" ADD COLUMN     "precioBase" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "lotes" ADD COLUMN     "parcela" VARCHAR(100);

-- CreateTable
CREATE TABLE "lote_ventas" (
    "id" SERIAL NOT NULL,
    "loteId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "clienteNombre" VARCHAR(200) NOT NULL,
    "clienteCuil" VARCHAR(50),
    "clienteTelefono" VARCHAR(50),
    "comisionPercent" DOUBLE PRECISION,
    "comisionMonto" DOUBLE PRECISION,
    "fechaVenta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "precioTotal" DOUBLE PRECISION NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'ARS',
    "anticipo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "saldo" DOUBLE PRECISION NOT NULL,
    "cantidadCuotas" INTEGER NOT NULL,
    "montoCuota" DOUBLE PRECISION NOT NULL,
    "interes" DOUBLE PRECISION,
    "periodicidad" VARCHAR(20) NOT NULL DEFAULT 'MENSUAL',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lote_ventas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lote_cuotas" (
    "id" SERIAL NOT NULL,
    "ventaId" INTEGER NOT NULL,
    "numeroCuota" INTEGER NOT NULL,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "pagado" BOOLEAN NOT NULL DEFAULT false,
    "fechaPago" TIMESTAMP(3),
    "notas" TEXT,

    CONSTRAINT "lote_cuotas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemporaryRental" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "pricePerNight" DECIMAL(10,2) NOT NULL,
    "pricePerWeek" DECIMAL(10,2),
    "pricePerMonth" DECIMAL(10,2),
    "minimumStay" INTEGER NOT NULL DEFAULT 1,
    "maximumStay" INTEGER,
    "checkInTime" VARCHAR(5) NOT NULL DEFAULT '15:00',
    "checkOutTime" VARCHAR(5) NOT NULL DEFAULT '11:00',
    "cleaningFee" DECIMAL(10,2),
    "commissionPercentage" DECIMAL(5,2) NOT NULL DEFAULT 15.0,
    "rules" TEXT,
    "amenities" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemporaryRental_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemporaryRentalAvailability" (
    "id" SERIAL NOT NULL,
    "temporaryRentalId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "priceOverride" DECIMAL(10,2),
    "notes" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemporaryRentalAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemporaryRentalBooking" (
    "id" SERIAL NOT NULL,
    "temporaryRentalId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "guestId" INTEGER,
    "guestName" VARCHAR(255) NOT NULL,
    "guestEmail" VARCHAR(255) NOT NULL,
    "guestPhone" VARCHAR(100) NOT NULL,
    "checkInDate" DATE NOT NULL,
    "checkOutDate" DATE NOT NULL,
    "numberOfGuests" INTEGER NOT NULL DEFAULT 1,
    "totalNights" INTEGER NOT NULL,
    "basePrice" DECIMAL(10,2) NOT NULL,
    "cleaningFee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "commissionAmount" DECIMAL(10,2) NOT NULL,
    "status" "TemporaryRentalBookingStatus" NOT NULL DEFAULT 'PENDING',
    "paymentStatus" "TemporaryRentalPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "specialRequests" TEXT,
    "bookingSource" VARCHAR(50) NOT NULL DEFAULT 'LANDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemporaryRentalBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lote_ventas_loteId_key" ON "lote_ventas"("loteId");

-- CreateIndex
CREATE INDEX "idx_lote_ventas_lote" ON "lote_ventas"("loteId");

-- CreateIndex
CREATE INDEX "idx_lote_ventas_tenant" ON "lote_ventas"("tenantId");

-- CreateIndex
CREATE INDEX "idx_lote_cuotas_venta" ON "lote_cuotas"("ventaId");

-- CreateIndex
CREATE INDEX "idx_temporary_rental_property" ON "TemporaryRental"("propertyId");

-- CreateIndex
CREATE INDEX "idx_temporary_rental_tenant" ON "TemporaryRental"("tenantId");

-- CreateIndex
CREATE INDEX "idx_temporary_rental_active" ON "TemporaryRental"("isActive");

-- CreateIndex
CREATE INDEX "idx_temporary_rental_published" ON "TemporaryRental"("isPublished");

-- CreateIndex
CREATE INDEX "idx_temporary_rental_availability_rental" ON "TemporaryRentalAvailability"("temporaryRentalId");

-- CreateIndex
CREATE INDEX "idx_temporary_rental_availability_date" ON "TemporaryRentalAvailability"("date");

-- CreateIndex
CREATE INDEX "idx_temporary_rental_availability_available" ON "TemporaryRentalAvailability"("isAvailable");

-- CreateIndex
CREATE UNIQUE INDEX "unique_temporary_rental_date" ON "TemporaryRentalAvailability"("temporaryRentalId", "date");

-- CreateIndex
CREATE INDEX "idx_temporary_rental_booking_rental" ON "TemporaryRentalBooking"("temporaryRentalId");

-- CreateIndex
CREATE INDEX "idx_temporary_rental_booking_tenant" ON "TemporaryRentalBooking"("tenantId");

-- CreateIndex
CREATE INDEX "idx_temporary_rental_booking_guest" ON "TemporaryRentalBooking"("guestId");

-- CreateIndex
CREATE INDEX "idx_temporary_rental_booking_status" ON "TemporaryRentalBooking"("status");

-- CreateIndex
CREATE INDEX "idx_temporary_rental_booking_payment" ON "TemporaryRentalBooking"("paymentStatus");

-- CreateIndex
CREATE INDEX "idx_temporary_rental_booking_checkin" ON "TemporaryRentalBooking"("checkInDate");

-- CreateIndex
CREATE INDEX "idx_temporary_rental_booking_checkout" ON "TemporaryRentalBooking"("checkOutDate");

-- CreateIndex
CREATE UNIQUE INDEX "idx_subscriptions_active_per_tenant" ON "subscriptions"("tenantId", "status") WHERE ((status)::text = ANY ((ARRAY['trialing'::character varying, 'active'::character varying])::text[]));

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("propertyId") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_loteVentaId_fkey" FOREIGN KEY ("loteVentaId") REFERENCES "lote_ventas"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lote_ventas" ADD CONSTRAINT "lote_ventas_loteId_fkey" FOREIGN KEY ("loteId") REFERENCES "lotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_ventas" ADD CONSTRAINT "lote_ventas_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lote_cuotas" ADD CONSTRAINT "lote_cuotas_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "lote_ventas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryRental" ADD CONSTRAINT "TemporaryRental_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("propertyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryRental" ADD CONSTRAINT "TemporaryRental_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryRentalAvailability" ADD CONSTRAINT "TemporaryRentalAvailability_temporaryRentalId_fkey" FOREIGN KEY ("temporaryRentalId") REFERENCES "TemporaryRental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryRentalBooking" ADD CONSTRAINT "TemporaryRentalBooking_temporaryRentalId_fkey" FOREIGN KEY ("temporaryRentalId") REFERENCES "TemporaryRental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryRentalBooking" ADD CONSTRAINT "TemporaryRentalBooking_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TemporaryRentalBooking" ADD CONSTRAINT "TemporaryRentalBooking_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Clients"("idClient") ON DELETE SET NULL ON UPDATE CASCADE;
