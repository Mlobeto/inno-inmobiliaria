// Parámetros de producción para el despliegue en Azure
// NO subir al repositorio — usar Azure Key Vault o GitHub Secrets para la contraseña
using 'main.bicep'

param projectName = 'inno'
param environment = 'prod'
param location = 'eastus2'
param pgAdminUser = 'inno_admin'
param pgAdminPassword = ''       // ← Completar antes del despliegue o pasar por --parameters
param pgSkuName = 'Standard_B2ms'
param pgVersion = '16'
param containerCpu = '0.5'
param containerMemory = '1Gi'
param backendImage = 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
