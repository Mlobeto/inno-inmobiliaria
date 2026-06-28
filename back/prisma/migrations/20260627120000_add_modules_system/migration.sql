-- CreateTable
CREATE TABLE IF NOT EXISTS "modules" (
    "moduleId"    VARCHAR(50)     NOT NULL,
    "name"        VARCHAR(100)    NOT NULL,
    "description" TEXT,
    "price"       DECIMAL(10, 2)  NOT NULL,
    "currency"    VARCHAR(3)      NOT NULL DEFAULT 'ARS',
    "featureKeys" JSONB           NOT NULL DEFAULT '[]',
    "question"    VARCHAR(500),
    "icon"        VARCHAR(50),
    "sortOrder"   INTEGER         NOT NULL DEFAULT 0,
    "isActive"    BOOLEAN         NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("moduleId")
);

CREATE INDEX IF NOT EXISTS "idx_modules_active" ON "modules"("isActive");
CREATE INDEX IF NOT EXISTS "idx_modules_sort_order" ON "modules"("sortOrder");

-- CreateTable
CREATE TABLE IF NOT EXISTS "tenant_modules" (
    "id"          SERIAL          NOT NULL,
    "tenantId"    INTEGER         NOT NULL,
    "moduleId"    VARCHAR(50)     NOT NULL,
    "status"      VARCHAR(20)     NOT NULL DEFAULT 'active',
    "activatedAt" TIMESTAMPTZ(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "canceledAt"  TIMESTAMPTZ(6),
    "createdAt"   TIMESTAMPTZ(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMPTZ(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_modules_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uq_tenant_modules" UNIQUE ("tenantId", "moduleId")
);

CREATE INDEX IF NOT EXISTS "idx_tenant_modules_tenant" ON "tenant_modules"("tenantId");
CREATE INDEX IF NOT EXISTS "idx_tenant_modules_module" ON "tenant_modules"("moduleId");
CREATE INDEX IF NOT EXISTS "idx_tenant_modules_status" ON "tenant_modules"("status");

-- AddForeignKey
ALTER TABLE "tenant_modules" ADD CONSTRAINT "tenant_modules_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("tenantId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tenant_modules" ADD CONSTRAINT "tenant_modules_moduleId_fkey"
    FOREIGN KEY ("moduleId") REFERENCES "modules"("moduleId") ON DELETE RESTRICT ON UPDATE CASCADE;
