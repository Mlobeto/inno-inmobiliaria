// ============================================================
// main.bicep — Infraestructura completa para inno-inmobiliaria
// Despliega: PostgreSQL Flexible Server, Container Registry,
//            Container Apps Environment, Container App (API),
//            Static Web App (front), Key Vault
// ============================================================

targetScope = 'resourceGroup'

// ---------- Parámetros ----------
@description('Nombre base del proyecto. Se usa como prefijo en todos los recursos.')
param projectName string = 'inno'

@description('Entorno: dev, staging, prod')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'prod'

@description('Región Azure')
param location string = resourceGroup().location

@description('Nombre de usuario administrador de PostgreSQL')
param pgAdminUser string = 'inno_admin'

@description('Contraseña del administrador de PostgreSQL (se guarda en Key Vault)')
@secure()
param pgAdminPassword string

@description('Nombre del SKU de PostgreSQL')
param pgSkuName string = 'Standard_B2ms'  // 2 vCores, 8 GB — suficiente para empezar

@description('Versión de PostgreSQL')
param pgVersion string = '16'

@description('SKU del Container App (CPU y memoria)')
param containerCpu string = '0.5'
param containerMemory string = '1Gi'

@description('Imagen Docker inicial del backend (se actualiza por CI/CD)')
param backendImage string = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'

@description('Crear role assignments (solo necesario en el primer deploy)')
param createRoleAssignments bool = false

// ---------- Variables ----------
var prefix = '${projectName}-${environment}'
var acrName = replace('${projectName}acr${environment}', '-', '') // ACR no acepta guiones
var pgServerName = '${prefix}-pg'
var pgDbName = 'inno_db'
var kvName = '${prefix}-kv-${take(uniqueString(subscription().subscriptionId), 6)}'
var containerEnvName = '${prefix}-cae'
var containerAppName = '${prefix}-api'
var staticWebAppName = '${prefix}-front'
var logWorkspaceName = '${prefix}-logs'

// ---------- Log Analytics (requerido por Container Apps) ----------
resource logWorkspace 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logWorkspaceName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ---------- Azure Container Registry ----------
resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: acrName
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: false  // Usar Managed Identity, nunca admin user
    anonymousPullEnabled: false
  }
}

// ---------- Key Vault ----------
resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: kvName
  location: location
  properties: {
    sku: {
      family: 'A'
      name: 'standard'
    }
    tenantId: subscription().tenantId
    enableSoftDelete: true
    softDeleteRetentionInDays: 7
    enablePurgeProtection: true
    enableRbacAuthorization: true  // Usar RBAC en lugar de access policies
  }
}

// Guardar contraseña de PostgreSQL en Key Vault
resource pgPasswordSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'pg-admin-password'
  properties: {
    value: pgAdminPassword
  }
}

// ---------- PostgreSQL Flexible Server ----------
resource pgServer 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: pgServerName
  location: location
  sku: {
    name: pgSkuName
    tier: 'Burstable'
  }
  properties: {
    version: pgVersion
    administratorLogin: pgAdminUser
    administratorLoginPassword: pgAdminPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

// Base de datos principal
resource pgDatabase 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: pgServer
  name: pgDbName
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

// Regla firewall: permite servicios Azure internos
resource pgFirewallAzure 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: pgServer
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ---------- Container Apps Environment ----------
resource containerEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logWorkspace.properties.customerId
        sharedKey: logWorkspace.listKeys().primarySharedKey
      }
    }
  }
}

// ---------- Container App — Backend (API Express) ----------
resource containerApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: containerAppName
  location: location
  identity: {
    type: 'SystemAssigned'  // Managed Identity para acceder a ACR y Key Vault sin credenciales
  }
  properties: {
    managedEnvironmentId: containerEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 3001
        transport: 'http'
        corsPolicy: {
          allowedOrigins: ['*']  // Ajustar al dominio real del front en producción
          allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
          allowedHeaders: ['*']
          allowCredentials: false
        }
      }
      registries: [
        {
          server: acr.properties.loginServer
          identity: 'system'  // Usa Managed Identity para pull desde ACR
        }
      ]
      secrets: [
        {
          name: 'database-url'
          // Construir DATABASE_URL usando los parámetros del servidor PostgreSQL
          value: 'postgresql://${pgAdminUser}:${pgAdminPassword}@${pgServer.properties.fullyQualifiedDomainName}:5432/${pgDbName}?sslmode=require'
        }
        {
          name: 'acs-connection-string'
          value: communicationService.listKeys().primaryConnectionString
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'api'
          image: backendImage
          resources: {
            cpu: json(containerCpu)
            memory: containerMemory
          }
          env: [
            {
              name: 'DATABASE_URL'
              secretRef: 'database-url'
            }
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: '3001'
            }
            {
              name: 'ACS_CONNECTION_STRING'
              secretRef: 'acs-connection-string'
            }
            {
              name: 'ACS_SENDER_ADDRESS'
              value: 'DoNotReply@GestProps.com.ar'
            }
          ]
        }
      ]
      scale: {
        minReplicas: 1   // Mínimo 1 para evitar cold starts en producción
        maxReplicas: 5
        rules: [
          {
            name: 'http-scaling'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

// Asignar rol AcrPull al Managed Identity del Container App
// Solo se crea en el primer deploy (createRoleAssignments=true) para evitar
// el error RoleAssignmentExists en deploys incrementales
resource acrPullRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (createRoleAssignments) {
  name: guid(acr.id, containerApp.id, 'acrpull')
  scope: acr
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '7f951dda-4ed3-4680-a7ca-43fe172d538d') // AcrPull
    principalId: containerApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// Asignar rol Key Vault Secrets User al Managed Identity
resource kvSecretsRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = if (createRoleAssignments) {
  name: guid(keyVault.id, containerApp.id, 'kvsecrets')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6') // Key Vault Secrets User
    principalId: containerApp.identity.principalId
    principalType: 'ServicePrincipal'
  }
}

// ---------- Azure Blob Storage — Media (imágenes/videos por tenant) ----------
var storageAccountName = replace('${projectName}media${environment}', '-', '') // sin guiones, max 24 chars

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: storageAccountName
  location: location
  sku: {
    name: 'Standard_LRS'  // Locally redundant — suficiente para media
  }
  kind: 'StorageV2'
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: true  // Necesario para servir imágenes públicas
    publicNetworkAccess: 'Enabled'
  }
}

// Blob service
resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storageAccount
  name: 'default'
  properties: {
    cors: {
      corsRules: [
        {
          allowedOrigins: ['*']
          allowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD', 'OPTIONS']
          allowedHeaders: ['*']
          exposedHeaders: ['*']
          maxAgeInSeconds: 3600
        }
      ]
    }
  }
}

// Container público para media (imágenes y videos de propiedades)
resource mediaContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'media'
  properties: {
    publicAccess: 'Blob'  // URLs públicas directas para imágenes/videos
  }
}

// Nota: el rol Storage Blob Data Contributor ya está asignado al Managed Identity del Container App (asignado en deploy inicial)

// ---------- Azure Communication Services — Email ----------

resource emailService 'Microsoft.Communication/emailServices@2023-04-01' = {
  name: '${prefix}-email'
  location: 'global'
  properties: {
    dataLocation: 'United States'
  }
}

// Dominio gestionado por Azure (gratuito, usa @azurecomm.net — sin verificar dominio propio)
resource emailDomain 'Microsoft.Communication/emailServices/domains@2023-04-01' = {
  parent: emailService
  name: 'AzureManagedDomain'
  location: 'global'
  properties: {
    domainManagement: 'AzureManaged'
  }
}

resource communicationService 'Microsoft.Communication/communicationServices@2023-04-01' = {
  name: '${prefix}-acs'
  location: 'global'
  properties: {
    dataLocation: 'United States'
    linkedDomains: [
      emailDomain.id
    ]
  }
}

// Guardar connection string de ACS en Key Vault
resource acsConnectionStringSecret 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = {
  parent: keyVault
  name: 'acs-connection-string'
  properties: {
    value: communicationService.listKeys().primaryConnectionString
  }
}

// ---------- Static Web App — Frontend (React/Vite) ----------
resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: 'eastus2'  // Static Web Apps tiene disponibilidad limitada por región
  sku: {
    name: 'Standard'  // Standard permite custom domains y auth
    tier: 'Standard'
  }
  properties: {
    buildProperties: {
      appLocation: 'front'
      outputLocation: 'dist'
      appBuildCommand: 'npm run build'
    }
  }
}

// ---------- Outputs ----------
output acrLoginServer string = acr.properties.loginServer
output containerAppUrl string = 'https://${containerApp.properties.configuration.ingress.fqdn}'
output staticWebAppUrl string = staticWebApp.properties.defaultHostname
output pgServerFqdn string = pgServer.properties.fullyQualifiedDomainName
output pgConnectionString string = 'postgresql://${pgAdminUser}@${pgServer.properties.fullyQualifiedDomainName}:5432/${pgDbName}?sslmode=require'
output storageAccountName string = storageAccount.name
output storageBlobEndpoint string = storageAccount.properties.primaryEndpoints.blob
output acsEndpoint string = communicationService.properties.hostName
output emailSenderDomain string = emailDomain.properties.mailFromSenderDomain
