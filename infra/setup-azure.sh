#!/bin/bash
# =============================================================
# setup-azure.sh — Script de configuración inicial en Azure
# Ejecutar UNA SOLA VEZ desde tu máquina local con az CLI
# =============================================================
set -euo pipefail

# ── Configuración ──────────────────────────────────────────────
PROJECT="inno"
ENVIRONMENT="prod"
RESOURCE_GROUP="${PROJECT}-${ENVIRONMENT}-rg"
LOCATION="eastus2"
GITHUB_REPO="Mlobeto/inno-inmobiliaria"   # <── tu repo
# ───────────────────────────────────────────────────────────────

echo "🔐 Verificando login en Azure..."
az account show > /dev/null 2>&1 || az login

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)
echo "✅ Suscripción: $SUBSCRIPTION_ID"

# 1. Crear Resource Group
echo ""
echo "📦 Creando Resource Group: $RESOURCE_GROUP..."
az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --output table

# 2. Crear Service Principal con Federated Identity (OIDC — sin secretos de larga duración)
echo ""
echo "🔑 Configurando Service Principal con Federated Identity para GitHub Actions..."

APP_NAME="${PROJECT}-github-actions"

# Reusar app si ya existe, crear si no
EXISTING_APP_ID=$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv 2>/dev/null)
if [[ -n "$EXISTING_APP_ID" && "$EXISTING_APP_ID" != "None" ]]; then
  echo "   App ya existe, reusando: $EXISTING_APP_ID"
  APP_ID="$EXISTING_APP_ID"
else
  APP_ID=$(az ad app create --display-name "$APP_NAME" --query appId -o tsv)
  echo "   App creada: $APP_ID"
fi

# Reusar SP si ya existe, crear si no
EXISTING_SP_OID=$(az ad sp show --id "$APP_ID" --query id -o tsv 2>/dev/null || true)
if [[ -n "$EXISTING_SP_OID" && "$EXISTING_SP_OID" != "None" ]]; then
  echo "   Service Principal ya existe, reusando."
  SP_OBJECT_ID="$EXISTING_SP_OID"
else
  echo "   Creando Service Principal..."
  SP_CREATE_OUTPUT=$(az ad sp create --id "$APP_ID" --query id -o tsv 2>&1) || true
  SP_OBJECT_ID=$(az ad sp show --id "$APP_ID" --query id -o tsv 2>/dev/null || true)
  if [[ -z "$SP_OBJECT_ID" || "$SP_OBJECT_ID" == "None" ]]; then
    echo "   ERROR al crear SP: $SP_CREATE_OUTPUT"
    echo "   Intentando con wait de 5s (propagación de Azure AD)..."
    sleep 5
    SP_OBJECT_ID=$(az ad sp show --id "$APP_ID" --query id -o tsv 2>/dev/null || true)
  fi
  if [[ -z "$SP_OBJECT_ID" || "$SP_OBJECT_ID" == "None" ]]; then
    echo "❌ No se pudo crear el Service Principal. Error: $SP_CREATE_OUTPUT"
    exit 1
  fi
  echo "   Service Principal creado: $SP_OBJECT_ID"
fi

# Agregar federated credential (ignorar error si ya existe)
az ad app federated-credential create \
  --id "$APP_ID" \
  --parameters "{
    \"name\": \"github-main\",
    \"issuer\": \"https://token.actions.githubusercontent.com\",
    \"subject\": \"repo:${GITHUB_REPO}:ref:refs/heads/main\",
    \"audiences\": [\"api://AzureADTokenExchange\"]
  }" 2>/dev/null || echo "   Federated credential ya existente, continuando."

# Asignar rol Contributor (ignorar si ya fue asignado)
az role assignment create \
  --assignee "$SP_OBJECT_ID" \
  --role "Contributor" \
  --scope "/subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}" \
  --output table 2>/dev/null || echo "   Rol Contributor ya asignado, continuando."

echo ""
echo "⚙️  Agrega estos secretos en GitHub → Settings → Secrets → Actions:"
echo ""
echo "  AZURE_CLIENT_ID       = $APP_ID"
echo "  AZURE_TENANT_ID       = $TENANT_ID"
echo "  AZURE_SUBSCRIPTION_ID = $SUBSCRIPTION_ID"
echo ""

# 3. Desplegar infraestructura con Bicep (con previsualización primero)
echo "🏗️  Previsualizando infraestructura Bicep (what-if)..."
read -r -p "¿Contraseña para PostgreSQL? " PG_PASSWORD

az deployment group what-if \
  --name "${PROJECT}-infra-deploy" \
  --resource-group "$RESOURCE_GROUP" \
  --template-file "./main.bicep" \
  --parameters "./main.bicepparam" \
  --parameters pgAdminPassword="$PG_PASSWORD"

echo ""
read -r -p "¿Confirmar despliegue? (s/N): " CONFIRM
if [[ "$CONFIRM" =~ ^[sS]$ ]]; then
  echo "🚀 Desplegando infraestructura..."
  az deployment group create \
    --name "${PROJECT}-infra-deploy" \
    --resource-group "$RESOURCE_GROUP" \
    --template-file "./main.bicep" \
    --parameters "./main.bicepparam" \
    --parameters pgAdminPassword="$PG_PASSWORD" \
    --output table

  # Obtener outputs
  ACR_SERVER=$(az deployment group show \
    --name "${PROJECT}-infra-deploy" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.outputs.acrLoginServer.value" -o tsv)

  API_URL=$(az deployment group show \
    --name "${PROJECT}-infra-deploy" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.outputs.containerAppUrl.value" -o tsv)

  FRONT_URL=$(az deployment group show \
    --name "${PROJECT}-infra-deploy" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.outputs.staticWebAppUrl.value" -o tsv)

  PG_FQDN=$(az deployment group show \
    --name "${PROJECT}-infra-deploy" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.outputs.pgServerFqdn.value" -o tsv)

  # Token para Static Web Apps CI/CD
  SWA_TOKEN=$(az staticwebapp secrets list \
    --name "inno-prod-front" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.apiKey" -o tsv)

  echo ""
  echo "✅ Infraestructura desplegada!"
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  ACR:        $ACR_SERVER"
  echo "  API URL:    $API_URL"
  echo "  Frontend:   https://$FRONT_URL"
  echo "  PostgreSQL: $PG_FQDN"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "⚙️  Secretos adicionales para GitHub Actions:"
  echo ""
  echo "  AZURE_STATIC_WEB_APPS_API_TOKEN = $SWA_TOKEN"
  echo "  VITE_API_URL = ${API_URL}/api"
  echo ""
  echo "  DATABASE_URL (para migraciones locales):"
  echo "  postgresql://inno_admin:<password>@${PG_FQDN}:5432/inno_db?sslmode=require"
  echo ""
  echo "4️⃣  Próximo paso: correr migraciones en la nueva DB de Azure:"
  echo "  DATABASE_URL='postgresql://inno_admin:<password>@${PG_FQDN}:5432/inno_db?sslmode=require' \\"
  echo "  npx prisma migrate deploy"
fi
