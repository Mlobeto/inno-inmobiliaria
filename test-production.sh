#!/bin/bash

# Script de verificación del backend en producción
# Uso: bash test-production.sh

BACKEND_URL="https://qlinmobiliaria.onrender.com"
FRONTEND_URL="https://ql-inmobiliaria.vercel.app"

echo "🔍 Verificando Backend en Producción..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Test 1: Health Check
echo "📊 Test 1: Health Check"
echo "URL: $BACKEND_URL/health"
curl -s -o /dev/null -w "Status: %{http_code}\nTiempo: %{time_total}s\n" "$BACKEND_URL/health"
echo ""

# Test 2: CORS Preflight
echo "📊 Test 2: CORS Preflight (OPTIONS)"
echo "URL: $BACKEND_URL/auth/login"
curl -s -o /dev/null -w "Status: %{http_code}\n" \
  -X OPTIONS \
  -H "Origin: $FRONTEND_URL" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  "$BACKEND_URL/auth/login"
echo ""

# Test 3: Login endpoint existe
echo "📊 Test 3: Login Endpoint"
echo "URL: $BACKEND_URL/auth/login"
curl -s -o /dev/null -w "Status: %{http_code}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Origin: $FRONTEND_URL" \
  -d '{"username":"test","password":"test"}' \
  "$BACKEND_URL/auth/login"
echo ""

# Test 4: Clients endpoint
echo "📊 Test 4: Clients Endpoint"
echo "URL: $BACKEND_URL/client"
curl -s -o /dev/null -w "Status: %{http_code}\n" \
  -H "Origin: $FRONTEND_URL" \
  "$BACKEND_URL/client"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Verificación completada"
echo ""
echo "Códigos de estado esperados:"
echo "  - Health Check: 200 ✅"
echo "  - CORS Preflight: 204 o 200 ✅"
echo "  - Login: 401 (credenciales incorrectas) o 200 ✅"
echo "  - Clients: 401 (sin token) o 200 ✅"
echo ""
echo "Si ves 404: El endpoint no existe ❌"
echo "Si ves 0 o error: El servidor no responde ❌"
