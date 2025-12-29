#!/bin/bash

# Script para probar la importación de clientes

echo "🚀 Probando importación de clientes..."
echo ""

# Hacer la petición POST con el archivo CSV
curl -X POST http://localhost:3001/api/import/clients \
  -H "Content-Type: multipart/form-data" \
  -F "file=@clientes_a_importar.csv" \
  | jq '.'

echo ""
echo "✅ Prueba completada"
