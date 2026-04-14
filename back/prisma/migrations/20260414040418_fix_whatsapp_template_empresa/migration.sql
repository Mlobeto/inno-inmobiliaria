-- CreateEnum
CREATE TYPE "enum_PaymentMethods_type" AS ENUM ('cbu', 'alias', 'qr', 'transferencia');

-- CreateEnum
CREATE TYPE "document_type_enum" AS ENUM ('IDENTITY', 'TAX', 'PROPERTY', 'INCOME', 'GUARANTEE', 'OTHER');

-- CreateEnum
CREATE TYPE "enum_ClientProperties_role" AS ENUM ('propietario', 'inquilino', 'vendedor', 'comprador');

-- CreateEnum
CREATE TYPE "enum_Leases_status" AS ENUM ('active', 'terminated');

-- CreateEnum
CREATE TYPE "enum_Leases_updateFrequency" AS ENUM ('semestral', 'cuatrimestral', 'anual');

-- CreateEnum
CREATE TYPE "enum_PaymentReceipts_status" AS ENUM ('pending', 'paid');

-- CreateEnum
CREATE TYPE "enum_PaymentReceipts_voucherStatus" AS ENUM ('none', 'pending_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "enum_PaymentReceipts_type" AS ENUM ('installment', 'commission', 'initial');

-- CreateEnum
CREATE TYPE "enum_Property_legalStatus" AS ENUM ('DEED', 'DEED_IN_PROCESS', 'PURCHASE_AGREEMENT', 'POSSESSION', 'ASSIGNMENT_OF_RIGHTS', 'INHERITANCE_IN_PROCESS', 'TRUST', 'ADVERSE_POSSESSION', 'TITLE_REGULARIZATION', 'HORIZONTAL_PROPERTY', 'SUBDIVISION');

-- CreateEnum
CREATE TYPE "enum_Property_type" AS ENUM ('venta', 'alquiler');

-- CreateEnum
CREATE TYPE "enum_Property_typeProperty" AS ENUM ('casa', 'departamento', 'duplex', 'finca', 'local', 'oficina', 'lote', 'terreno');

-- CreateTable
CREATE TABLE "ClientProperties" (
    "role" "enum_ClientProperties_role" NOT NULL,
    "clientId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" INTEGER NOT NULL,

    CONSTRAINT "ClientProperties_pkey" PRIMARY KEY ("clientId","propertyId")
);

-- CreateTable
CREATE TABLE "Clients" (
    "idClient" SERIAL NOT NULL,
    "cuil" VARCHAR(255),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "direccion" VARCHAR(255),
    "ciudad" VARCHAR(255) NOT NULL,
    "provincia" VARCHAR(255),
    "mobilePhone" VARCHAR(255) NOT NULL,
    "linkMaps" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),
    "tenantId" INTEGER NOT NULL,
    "migrated_to_documents" BOOLEAN DEFAULT false,
    "codigo_postal" VARCHAR(10),

    CONSTRAINT "Clients_pkey" PRIMARY KEY ("idClient")
);

-- CreateTable
CREATE TABLE "Garantors" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "cuil" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "mobilePhone" VARCHAR(255),
    "email" VARCHAR(255),
    "description" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseId" INTEGER,
    "tenantId" INTEGER,

    CONSTRAINT "Garantors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leases" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "landlordId" INTEGER NOT NULL,
    "renterId" INTEGER NOT NULL,
    "agentId" INTEGER,
    "startDate" DATE NOT NULL,
    "rentAmount" DECIMAL(12,2) NOT NULL,
    "updateFrequency" VARCHAR(50),
    "commission" DECIMAL(5,2),
    "totalMonths" INTEGER NOT NULL,
    "inventory" TEXT NOT NULL,
    "garantiaType" VARCHAR(20),
    "seguroCaucionCompania" VARCHAR(255),
    "seguroCaucionDatos" TEXT,
    "status" VARCHAR(50) DEFAULT 'active',
    "pdfPath" VARCHAR(500),
    "customContent" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(6),

    CONSTRAINT "Leases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MercadoLibreConfig" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "mlUserId" VARCHAR(100),
    "accessToken" TEXT,
    "accessTokenIv" VARCHAR(32),
    "accessTokenAuthTag" VARCHAR(32),
    "accessTokenSalt" VARCHAR(128),
    "refreshToken" TEXT,
    "refreshTokenIv" VARCHAR(32),
    "refreshTokenAuthTag" VARCHAR(32),
    "refreshTokenSalt" VARCHAR(128),
    "tokenExpiresAt" TIMESTAMP(6),
    "isActive" BOOLEAN DEFAULT false,
    "lastSync" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MercadoLibreConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MercadoLibreMessages" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "propertyId" INTEGER,
    "mlListingId" VARCHAR(100),
    "mlMessageId" VARCHAR(100) NOT NULL,
    "mlQuestionId" VARCHAR(100),
    "mlUserId" VARCHAR(100),
    "userNickname" VARCHAR(255),
    "message" TEXT NOT NULL,
    "answer" TEXT,
    "status" VARCHAR(50) DEFAULT 'UNANSWERED',
    "isRead" BOOLEAN DEFAULT false,
    "receivedAt" TIMESTAMP(6),
    "answeredAt" TIMESTAMP(6),
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MercadoLibreMessages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentReceipts" (
    "id" SERIAL NOT NULL,
    "paymentDate" TIMESTAMPTZ(6) NOT NULL,
    "amount" DECIMAL NOT NULL,
    "originalAmount" DECIMAL,
    "originalCurrency" VARCHAR(3) DEFAULT 'ARS',
    "dolarRateUsed" DECIMAL,
    "period" VARCHAR(255) NOT NULL,
    "installmentNumber" INTEGER,
    "totalInstallments" INTEGER,
    "type" "enum_PaymentReceipts_type" NOT NULL DEFAULT 'installment',
    "status" "enum_PaymentReceipts_status" NOT NULL DEFAULT 'pending',
    "voucherUrl" VARCHAR(1000),
    "voucherStatus" "enum_PaymentReceipts_voucherStatus" NOT NULL DEFAULT 'none',
    "voucherRejReason" VARCHAR(500),
    "paidAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),
    "leaseId" INTEGER,
    "idClient" INTEGER,
    "tenantId" INTEGER,

    CONSTRAINT "PaymentReceipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "propertyId" SERIAL NOT NULL,
    "address" VARCHAR(255) NOT NULL,
    "neighborhood" VARCHAR(255),
    "socio" VARCHAR(255),
    "city" VARCHAR(255),
    "type" "enum_Property_type" NOT NULL,
    "typeProperty" "enum_Property_typeProperty" NOT NULL,
    "price" DECIMAL NOT NULL,
    "precioReferencia" DECIMAL,
    "rooms" INTEGER,
    "comision" DECIMAL NOT NULL,
    "isAvailable" BOOLEAN DEFAULT true,
    "description" TEXT,
    "escritura" "enum_Property_legalStatus" NOT NULL,
    "matriculaOPadron" VARCHAR(255),
    "frente" VARCHAR(255),
    "profundidad" VARCHAR(255),
    "linkInstagram" VARCHAR(255),
    "linkMaps" VARCHAR(255),
    "images" VARCHAR(255)[] DEFAULT ARRAY[]::VARCHAR(255)[],
    "plantType" VARCHAR(255),
    "plantQuantity" INTEGER,
    "bathrooms" INTEGER,
    "highlights" TEXT,
    "inventory" TEXT,
    "superficieCubierta" VARCHAR(255),
    "superficieTotal" VARCHAR(255),
    "requisito" TEXT,
    "whatsappTemplate" TEXT DEFAULT 'Gracias por ponerte en contacto con {empresa}! Estamos encantados de poder ayudar. 

{descripcion}

Precio: {precio}
Ubicación: {direccion}

Estamos a tu entera disposición por dudas, precio o consultas.',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),
    "tenantId" INTEGER NOT NULL,
    "agentId" INTEGER,
    "rentalType" VARCHAR(50) DEFAULT 'TRADICIONAL',
    "minStayDays" INTEGER,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'ARS',
    "isPublishedInLanding" BOOLEAN DEFAULT false,
    "rentedAt" TIMESTAMP(6),

    CONSTRAINT "Property_pkey" PRIMARY KEY ("propertyId")
);

-- CreateTable
CREATE TABLE "PropertyMLListings" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "mlListingId" VARCHAR(100) NOT NULL,
    "mlStatus" VARCHAR(50),
    "mlPermalink" TEXT,
    "mlTitle" VARCHAR(255),
    "mlPrice" DECIMAL(15,2),
    "viewsCount" INTEGER DEFAULT 0,
    "lastSync" TIMESTAMP(6),
    "syncErrors" TEXT,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyMLListings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentUpdates" (
    "id" SERIAL NOT NULL,
    "updateDate" TIMESTAMPTZ(6) NOT NULL,
    "oldRentAmount" DECIMAL NOT NULL,
    "newRentAmount" DECIMAL NOT NULL,
    "period" VARCHAR(255) NOT NULL,
    "pdfPath" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),
    "leaseId" INTEGER,
    "tenantId" INTEGER,

    CONSTRAINT "RentUpdates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleContracts" (
    "id" SERIAL NOT NULL,
    "saleDate" TIMESTAMPTZ(6) NOT NULL,
    "salePrice" DECIMAL NOT NULL,
    "commission" DECIMAL,
    "propertyId" INTEGER NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "buyerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenantId" INTEGER,
    "agentId" INTEGER,

    CONSTRAINT "SaleContracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_settings" (
    "id" SERIAL NOT NULL,
    "signatureUrl" VARCHAR(255),
    "company_name" VARCHAR(255),
    "company_address" VARCHAR(255),
    "company_phone" VARCHAR(255),
    "company_email" VARCHAR(255),
    "company_registration" VARCHAR(255),
    "company_cuit" VARCHAR(255),
    "company_logo_url" VARCHAR(255),
    "contract_footer_text" TEXT,
    "additional_config" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tenant_id" INTEGER,
    "whatsapp_template" TEXT,
    "requisitos_template" TEXT,
    "company_city" VARCHAR(255),
    "company_province" VARCHAR(255),
    "company_ingresos_brutos" VARCHAR(255),
    "company_condicion_iva" VARCHAR(255) DEFAULT 'RESPONSABLE MONOTRIBUTO',
    "company_inicio_actividad" VARCHAR(255),
    "professional_title" VARCHAR(255),
    "receipt_prefix" VARCHAR(1) DEFAULT 'X',
    "receipt_footer_text" TEXT,
    "company_whatsapp" VARCHAR(50),

    CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "adminId" SERIAL NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) DEFAULT 'admin',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),
    "tenantId" INTEGER,
    "fullName" VARCHAR(255),
    "email" VARCHAR(255),
    "pushToken" VARCHAR(500),

    CONSTRAINT "admins_pkey" PRIMARY KEY ("adminId")
);

-- CreateTable
CREATE TABLE "client_documents" (
    "document_id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "document_type" "document_type_enum" NOT NULL,
    "country" VARCHAR(2) NOT NULL DEFAULT 'AR',
    "document_code" VARCHAR(20) NOT NULL,
    "number" VARCHAR(50) NOT NULL,
    "issued_by" VARCHAR(100),
    "issued_at" DATE,
    "expires_at" DATE,
    "is_primary" BOOLEAN DEFAULT false,
    "is_verified" BOOLEAN DEFAULT false,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "client_documents_pkey" PRIMARY KEY ("document_id")
);

-- CreateTable
CREATE TABLE "client_properties" (
    "idClient" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "role" VARCHAR(50),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_properties_pkey" PRIMARY KEY ("idClient","propertyId")
);

-- CreateTable
CREATE TABLE "clients" (
    "idClient" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "dni" VARCHAR(20),
    "address" TEXT,
    "city" VARCHAR(100),
    "nationality" VARCHAR(100),
    "maritalStatus" VARCHAR(50),
    "profession" VARCHAR(100),
    "birthDate" DATE,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("idClient")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "agentId" INTEGER NOT NULL,
    "transactionType" VARCHAR(50) NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "propertyId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "transactionAmount" DECIMAL(12,2) NOT NULL,
    "inmobiliariaCommissionPercent" DECIMAL(5,2),
    "inmobiliariaCommissionAmount" DECIMAL(12,2),
    "agentCommissionPercent" DECIMAL(5,2),
    "agentCommissionAmount" DECIMAL(12,2),
    "status" VARCHAR(50) DEFAULT 'PENDING',
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(6),
    "paidAt" TIMESTAMP(6),
    "notes" TEXT,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "garantors" (
    "garantorId" SERIAL NOT NULL,
    "leaseId" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "dni" VARCHAR(20),
    "phone" VARCHAR(50),
    "address" TEXT,
    "email" VARCHAR(255),
    "relationship" VARCHAR(100),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "garantors_pkey" PRIMARY KEY ("garantorId")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "adminId" INTEGER NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expiresAt" TIMESTAMP(6) NOT NULL,
    "used" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_receipts" (
    "receiptId" SERIAL NOT NULL,
    "leaseId" INTEGER,
    "clientId" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" DATE NOT NULL,
    "paymentMethod" VARCHAR(50),
    "receiptNumber" VARCHAR(100),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_receipts_pkey" PRIMARY KEY ("receiptId")
);

-- CreateTable
CREATE TABLE "pdf_templates" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "templateType" VARCHAR(50) NOT NULL,
    "templateName" VARCHAR(100) NOT NULL,
    "htmlTemplate" TEXT NOT NULL,
    "styles" TEXT,
    "headerHtml" TEXT,
    "footerHtml" TEXT,
    "variables" JSONB DEFAULT '{}',
    "pageSize" VARCHAR(20) NOT NULL DEFAULT 'A4',
    "orientation" VARCHAR(20) NOT NULL DEFAULT 'portrait',
    "margins" JSONB DEFAULT '{"top": "20mm", "left": "15mm", "right": "15mm", "bottom": "20mm"}',
    "propertyPurpose" VARCHAR(20),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "pdf_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "planId" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "priceMonthly" DECIMAL(10,2) NOT NULL,
    "priceYearly" DECIMAL(10,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'ARS',
    "mpPlanId" VARCHAR(100),
    "stripePriceId" VARCHAR(100),
    "features" JSONB NOT NULL DEFAULT '{}',
    "trialDays" INTEGER NOT NULL DEFAULT 14,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPopular" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("planId")
);

-- CreateTable
CREATE TABLE "properties" (
    "propertyId" SERIAL NOT NULL,
    "title" VARCHAR(255),
    "address" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(50) DEFAULT 'available',
    "price" DECIMAL(12,2),
    "description" TEXT,
    "images" TEXT[],
    "surface" DECIMAL(10,2),
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "garages" INTEGER,
    "amenities" TEXT[],
    "location" JSONB,
    "is_published" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),
    "isPublishedInLanding" BOOLEAN DEFAULT false,
    "rentedAt" TIMESTAMP(6),

    CONSTRAINT "properties_pkey" PRIMARY KEY ("propertyId")
);

-- CreateTable
CREATE TABLE "rent_updates" (
    "id" SERIAL NOT NULL,
    "leaseId" INTEGER,
    "oldAmount" DECIMAL(12,2) NOT NULL,
    "newAmount" DECIMAL(12,2) NOT NULL,
    "updateDate" DATE NOT NULL,
    "appliedAt" TIMESTAMPTZ(6),
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rent_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_contracts" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER,
    "buyerId" INTEGER,
    "sellerId" INTEGER,
    "salePrice" DECIMAL(12,2) NOT NULL,
    "saleDate" DATE NOT NULL,
    "status" VARCHAR(50) DEFAULT 'pending',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "subscriptionId" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" INTEGER NOT NULL,
    "planId" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'trialing',
    "paymentProvider" VARCHAR(20) NOT NULL DEFAULT 'mercadopago',
    "mpPreferenceId" VARCHAR(100),
    "mpSubscriptionId" VARCHAR(100),
    "mpPayerId" VARCHAR(100),
    "mpPaymentId" VARCHAR(100),
    "stripeSubscriptionId" VARCHAR(100),
    "stripeCustomerId" VARCHAR(100),
    "storeSubscriptionId" VARCHAR(100),
    "storeReceipt" TEXT,
    "currentPeriodStart" TIMESTAMP(6),
    "currentPeriodEnd" TIMESTAMP(6),
    "trialStart" TIMESTAMP(6),
    "trialEnd" TIMESTAMP(6),
    "canceledAt" TIMESTAMP(6),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "billingCycle" VARCHAR(20) NOT NULL DEFAULT 'monthly',
    "amount" DECIMAL(10,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'ARS',
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("subscriptionId")
);

-- CreateTable
CREATE TABLE "tenants" (
    "tenantId" SERIAL NOT NULL,
    "businessName" VARCHAR(255) NOT NULL,
    "cuit" VARCHAR(13) NOT NULL,
    "subdomain" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "address" TEXT,
    "logo" VARCHAR(500),
    "plan" VARCHAR(50) DEFAULT 'FREE',
    "status" VARCHAR(50) DEFAULT 'TRIAL',
    "maxAgents" INTEGER DEFAULT 1,
    "maxProperties" INTEGER DEFAULT 10,
    "features" JSONB DEFAULT '{"ml": false, "reports": true, "whatsapp": false, "contracts": true}',
    "trialEndsAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),
    "signatureUrl" VARCHAR(500),

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("tenantId")
);

-- CreateTable
CREATE TABLE "PaymentMethods" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "type" "enum_PaymentMethods_type" NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "value" VARCHAR(500) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMethods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantFiscalProfile" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "cuit" VARCHAR(13) NOT NULL,
    "businessName" VARCHAR(255) NOT NULL,
    "ivaCondition" VARCHAR(50) NOT NULL,
    "grossIncomeCondition" VARCHAR(100),
    "pointOfSale" INTEGER NOT NULL,
    "environment" VARCHAR(20) NOT NULL DEFAULT 'homologacion',
    "certificatePem" TEXT,
    "privateKeyEncrypted" TEXT,
    "privateKeyIv" VARCHAR(32),
    "privateKeyAuthTag" VARCHAR(32),
    "privateKeySalt" VARCHAR(128),
    "certificateExpiresAt" TIMESTAMPTZ(6),
    "wsaaStatus" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "arcaServiceStatus" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "isReadyToInvoice" BOOLEAN NOT NULL DEFAULT false,
    "onboardingStatus" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TenantFiscalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoice" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "fiscalProfileId" INTEGER NOT NULL,
    "customerName" VARCHAR(255) NOT NULL,
    "customerDocType" INTEGER NOT NULL,
    "customerDocNumber" VARCHAR(20) NOT NULL,
    "invoiceType" INTEGER NOT NULL,
    "pointOfSale" INTEGER NOT NULL,
    "invoiceNumber" INTEGER,
    "concept" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'PES',
    "exchangeRate" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "netAmount" DECIMAL(12,2) NOT NULL,
    "taxAmount" DECIMAL(12,2) NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "serviceFromDate" VARCHAR(8),
    "serviceToDate" VARCHAR(8),
    "dueDate" VARCHAR(8),
    "cae" VARCHAR(14),
    "caeExpiresAt" TIMESTAMPTZ(6),
    "arcaStatus" VARCHAR(50) NOT NULL DEFAULT 'draft',
    "authorizationError" TEXT,
    "rawRequestSnapshot" JSONB,
    "rawResponseSnapshot" JSONB,
    "issuedAt" TIMESTAMPTZ(6),
    "createdBy" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElectronicInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectronicInvoiceItem" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "ElectronicInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FiscalAuditLog" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(50),
    "requestData" JSONB,
    "responseData" JSONB,
    "status" VARCHAR(20) NOT NULL,
    "errorMessage" TEXT,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FiscalAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_payment_logs" (
    "id" SERIAL NOT NULL,
    "subscriptionId" UUID NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "mpPaymentId" VARCHAR(100),
    "mpPreapprovalId" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(10,2),
    "currency" VARCHAR(3) NOT NULL DEFAULT 'ARS',
    "periodStart" TIMESTAMP(6),
    "periodEnd" TIMESTAMP(6),
    "rawData" JSONB,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_payment_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_client_properties_tenant" ON "ClientProperties"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Clients_cuil_key" ON "Clients"("cuil");

-- CreateIndex
CREATE UNIQUE INDEX "Clients_email_key" ON "Clients"("email");

-- CreateIndex
CREATE INDEX "idx_clients_codigo_postal" ON "Clients"("codigo_postal");

-- CreateIndex
CREATE INDEX "idx_clients_migration_status" ON "Clients"("migrated_to_documents") WHERE (migrated_to_documents = false);

-- CreateIndex
CREATE INDEX "idx_clients_tenant" ON "Clients"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Garantors_email_key" ON "Garantors"("email");

-- CreateIndex
CREATE INDEX "idx_garantors_tenant" ON "Garantors"("tenantId");

-- CreateIndex
CREATE INDEX "idx_leases_agent" ON "Leases"("agentId");

-- CreateIndex
CREATE INDEX "idx_leases_landlord" ON "Leases"("landlordId");

-- CreateIndex
CREATE INDEX "idx_leases_property" ON "Leases"("propertyId");

-- CreateIndex
CREATE INDEX "idx_leases_renter" ON "Leases"("renterId");

-- CreateIndex
CREATE INDEX "idx_leases_status" ON "Leases"("status");

-- CreateIndex
CREATE INDEX "idx_leases_tenant" ON "Leases"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "MercadoLibreConfig_tenantId_key" ON "MercadoLibreConfig"("tenantId");

-- CreateIndex
CREATE INDEX "idx_ml_config_active" ON "MercadoLibreConfig"("isActive");

-- CreateIndex
CREATE INDEX "idx_ml_config_tenant" ON "MercadoLibreConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "MercadoLibreMessages_mlMessageId_key" ON "MercadoLibreMessages"("mlMessageId");

-- CreateIndex
CREATE INDEX "idx_ml_msg_property" ON "MercadoLibreMessages"("propertyId");

-- CreateIndex
CREATE INDEX "idx_ml_msg_read" ON "MercadoLibreMessages"("isRead");

-- CreateIndex
CREATE INDEX "idx_ml_msg_received" ON "MercadoLibreMessages"("receivedAt");

-- CreateIndex
CREATE INDEX "idx_ml_msg_status" ON "MercadoLibreMessages"("status");

-- CreateIndex
CREATE INDEX "idx_ml_msg_tenant" ON "MercadoLibreMessages"("tenantId");

-- CreateIndex
CREATE INDEX "idx_payment_receipts_tenant" ON "PaymentReceipts"("tenantId");

-- CreateIndex
CREATE INDEX "idx_payment_receipts_currency" ON "PaymentReceipts"("originalCurrency");

-- CreateIndex
CREATE INDEX "idx_property_agent" ON "Property"("agentId");

-- CreateIndex
CREATE INDEX "idx_property_tenant" ON "Property"("tenantId");

-- CreateIndex
CREATE INDEX "idx_ml_listing_id" ON "PropertyMLListings"("mlListingId");

-- CreateIndex
CREATE INDEX "idx_ml_listing_property" ON "PropertyMLListings"("propertyId");

-- CreateIndex
CREATE INDEX "idx_ml_listing_status" ON "PropertyMLListings"("mlStatus");

-- CreateIndex
CREATE INDEX "idx_ml_listing_tenant" ON "PropertyMLListings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyMLListings_propertyId_tenantId_key" ON "PropertyMLListings"("propertyId", "tenantId");

-- CreateIndex
CREATE INDEX "idx_rent_updates_tenant" ON "RentUpdates"("tenantId");

-- CreateIndex
CREATE INDEX "idx_sale_contracts_agent" ON "SaleContracts"("agentId");

-- CreateIndex
CREATE INDEX "idx_sale_contracts_tenant" ON "SaleContracts"("tenantId");

-- CreateIndex
CREATE INDEX "idx_admin_settings_tenant" ON "admin_settings"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE INDEX "idx_admins_role" ON "admins"("role");

-- CreateIndex
CREATE INDEX "idx_admins_tenant" ON "admins"("tenantId");

-- CreateIndex
CREATE INDEX "idx_client_documents_client" ON "client_documents"("client_id");

-- CreateIndex
CREATE INDEX "idx_client_documents_country" ON "client_documents"("country");

-- CreateIndex
CREATE INDEX "idx_client_documents_primary" ON "client_documents"("client_id", "is_primary") WHERE (is_primary = true);

-- CreateIndex
CREATE INDEX "idx_client_documents_tenant" ON "client_documents"("tenant_id");

-- CreateIndex
CREATE INDEX "idx_client_documents_type" ON "client_documents"("document_type");

-- CreateIndex
CREATE UNIQUE INDEX "unique_primary_doc_per_type" ON "client_documents"("client_id", "document_type", "document_code", "is_primary");

-- CreateIndex
CREATE INDEX "idx_clients_dni" ON "clients"("dni");

-- CreateIndex
CREATE INDEX "idx_clients_email" ON "clients"("email");

-- CreateIndex
CREATE INDEX "idx_commissions_agent" ON "commissions"("agentId");

-- CreateIndex
CREATE INDEX "idx_commissions_status" ON "commissions"("status");

-- CreateIndex
CREATE INDEX "idx_commissions_tenant" ON "commissions"("tenantId");

-- CreateIndex
CREATE INDEX "idx_commissions_type" ON "commissions"("transactionType");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_password_reset_email" ON "password_reset_tokens"("email");

-- CreateIndex
CREATE INDEX "idx_password_reset_expires" ON "password_reset_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_password_reset_token" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "idx_payment_receipts_date" ON "payment_receipts"("paymentDate");

-- CreateIndex
CREATE INDEX "idx_payment_receipts_lease" ON "payment_receipts"("leaseId");

-- CreateIndex
CREATE INDEX "idx_pdf_templates_active" ON "pdf_templates"("isActive");

-- CreateIndex
CREATE INDEX "idx_pdf_templates_tenant_default" ON "pdf_templates"("tenantId", "isDefault");

-- CreateIndex
CREATE INDEX "idx_pdf_templates_tenant_type" ON "pdf_templates"("tenantId", "templateType");

-- CreateIndex
CREATE INDEX "idx_pdf_templates_tenant_type_purpose" ON "pdf_templates"("tenantId", "templateType", "propertyPurpose");

-- CreateIndex
CREATE INDEX "idx_plans_active" ON "plans"("isActive");

-- CreateIndex
CREATE INDEX "idx_plans_sort_order" ON "plans"("sortOrder");

-- CreateIndex
CREATE INDEX "idx_properties_status" ON "properties"("status");

-- CreateIndex
CREATE INDEX "idx_properties_type" ON "properties"("type");

-- CreateIndex
CREATE INDEX "idx_subscriptions_period_end" ON "subscriptions"("currentPeriodEnd");

-- CreateIndex
CREATE INDEX "idx_subscriptions_provider" ON "subscriptions"("paymentProvider");

-- CreateIndex
CREATE INDEX "idx_subscriptions_status" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "idx_subscriptions_tenant" ON "subscriptions"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "idx_subscriptions_active_per_tenant" ON "subscriptions"("tenantId", "status") WHERE ((status)::text = ANY ((ARRAY['trialing'::character varying, 'active'::character varying])::text[]));

-- CreateIndex
CREATE UNIQUE INDEX "tenants_cuit_key" ON "tenants"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_subdomain_key" ON "tenants"("subdomain");

-- CreateIndex
CREATE INDEX "idx_tenants_status" ON "tenants"("status");

-- CreateIndex
CREATE INDEX "idx_tenants_subdomain" ON "tenants"("subdomain");

-- CreateIndex
CREATE INDEX "tenants_cuit" ON "tenants"("cuit");

-- CreateIndex
CREATE INDEX "tenants_status" ON "tenants"("status");

-- CreateIndex
CREATE INDEX "tenants_subdomain" ON "tenants"("subdomain");

-- CreateIndex
CREATE INDEX "idx_payment_methods_tenant" ON "PaymentMethods"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantFiscalProfile_tenantId_key" ON "TenantFiscalProfile"("tenantId");

-- CreateIndex
CREATE INDEX "idx_fiscal_profile_tenant" ON "TenantFiscalProfile"("tenantId");

-- CreateIndex
CREATE INDEX "idx_einvoice_tenant" ON "ElectronicInvoice"("tenantId");

-- CreateIndex
CREATE INDEX "idx_einvoice_fiscal_profile" ON "ElectronicInvoice"("fiscalProfileId");

-- CreateIndex
CREATE INDEX "idx_einvoice_cae" ON "ElectronicInvoice"("cae");

-- CreateIndex
CREATE INDEX "idx_einvoice_status" ON "ElectronicInvoice"("arcaStatus");

-- CreateIndex
CREATE INDEX "idx_einvoice_type_pos_tenant" ON "ElectronicInvoice"("invoiceType", "pointOfSale", "tenantId");

-- CreateIndex
CREATE INDEX "idx_einvoice_item_invoice" ON "ElectronicInvoiceItem"("invoiceId");

-- CreateIndex
CREATE INDEX "idx_einvoice_item_tenant" ON "ElectronicInvoiceItem"("tenantId");

-- CreateIndex
CREATE INDEX "idx_fiscal_audit_tenant" ON "FiscalAuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "idx_fiscal_audit_entity" ON "FiscalAuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "idx_fiscal_audit_created" ON "FiscalAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "idx_payment_logs_subscription" ON "subscription_payment_logs"("subscriptionId");

-- CreateIndex
CREATE INDEX "idx_payment_logs_tenant" ON "subscription_payment_logs"("tenantId");

-- CreateIndex
CREATE INDEX "idx_payment_logs_mp_payment" ON "subscription_payment_logs"("mpPaymentId");

-- CreateIndex
CREATE INDEX "idx_payment_logs_status" ON "subscription_payment_logs"("status");

-- CreateIndex
CREATE INDEX "idx_payment_logs_created" ON "subscription_payment_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "ClientProperties" ADD CONSTRAINT "ClientProperties_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Clients"("idClient") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProperties" ADD CONSTRAINT "ClientProperties_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("propertyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientProperties" ADD CONSTRAINT "ClientProperties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Clients" ADD CONSTRAINT "Clients_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Garantors" ADD CONSTRAINT "Garantors_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Leases" ADD CONSTRAINT "Leases_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "admins"("adminId") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Leases" ADD CONSTRAINT "Leases_landlordId_fkey" FOREIGN KEY ("landlordId") REFERENCES "Clients"("idClient") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Leases" ADD CONSTRAINT "Leases_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("propertyId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Leases" ADD CONSTRAINT "Leases_renterId_fkey" FOREIGN KEY ("renterId") REFERENCES "Clients"("idClient") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Leases" ADD CONSTRAINT "Leases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MercadoLibreConfig" ADD CONSTRAINT "MercadoLibreConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MercadoLibreMessages" ADD CONSTRAINT "MercadoLibreMessages_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("propertyId") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MercadoLibreMessages" ADD CONSTRAINT "MercadoLibreMessages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PaymentReceipts" ADD CONSTRAINT "PaymentReceipts_idClient_fkey" FOREIGN KEY ("idClient") REFERENCES "Clients"("idClient") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentReceipts" ADD CONSTRAINT "PaymentReceipts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "admins"("adminId") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PropertyMLListings" ADD CONSTRAINT "PropertyMLListings_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("propertyId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PropertyMLListings" ADD CONSTRAINT "PropertyMLListings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "RentUpdates" ADD CONSTRAINT "RentUpdates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SaleContracts" ADD CONSTRAINT "SaleContracts_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "admins"("adminId") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "SaleContracts" ADD CONSTRAINT "SaleContracts_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "Clients"("idClient") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleContracts" ADD CONSTRAINT "SaleContracts_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("propertyId") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleContracts" ADD CONSTRAINT "SaleContracts_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Clients"("idClient") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleContracts" ADD CONSTRAINT "SaleContracts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "admin_settings" ADD CONSTRAINT "admin_settings_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_documents" ADD CONSTRAINT "fk_client_documents_client" FOREIGN KEY ("client_id") REFERENCES "Clients"("idClient") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_documents" ADD CONSTRAINT "fk_client_documents_tenant" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_properties" ADD CONSTRAINT "client_properties_idClient_fkey" FOREIGN KEY ("idClient") REFERENCES "clients"("idClient") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "client_properties" ADD CONSTRAINT "client_properties_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("propertyId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "admins"("adminId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "admins"("adminId") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Clients"("idClient") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("propertyId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "fk_admin" FOREIGN KEY ("adminId") REFERENCES "admins"("adminId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payment_receipts" ADD CONSTRAINT "payment_receipts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("idClient") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pdf_templates" ADD CONSTRAINT "pdf_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "admins"("adminId") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pdf_templates" ADD CONSTRAINT "pdf_templates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sale_contracts" ADD CONSTRAINT "sale_contracts_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "clients"("idClient") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sale_contracts" ADD CONSTRAINT "sale_contracts_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("propertyId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sale_contracts" ADD CONSTRAINT "sale_contracts_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "clients"("idClient") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("planId") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "PaymentMethods" ADD CONSTRAINT "PaymentMethods_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TenantFiscalProfile" ADD CONSTRAINT "TenantFiscalProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectronicInvoice" ADD CONSTRAINT "ElectronicInvoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectronicInvoice" ADD CONSTRAINT "ElectronicInvoice_fiscalProfileId_fkey" FOREIGN KEY ("fiscalProfileId") REFERENCES "TenantFiscalProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectronicInvoiceItem" ADD CONSTRAINT "ElectronicInvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "ElectronicInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectronicInvoiceItem" ADD CONSTRAINT "ElectronicInvoiceItem_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FiscalAuditLog" ADD CONSTRAINT "FiscalAuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payment_logs" ADD CONSTRAINT "subscription_payment_logs_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("subscriptionId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_payment_logs" ADD CONSTRAINT "subscription_payment_logs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE CASCADE;
