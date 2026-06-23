#!/bin/bash
BASE="http://127.0.0.1:8000"
USER="admin"
PASS="admin123"
V='\033[0;32m'; R='\033[0;31m'; A='\033[1;33m'; N='\033[0m'

echo "============================================"
echo "  PRUEBA BACKEND - BARBER PRO APP"
echo "============================================"

echo -e "\n${A}[0] Verificando servidor...${N}"
if ! curl -s "$BASE/" > /dev/null; then
  echo -e "${R}✗ El servidor no responde. Levantalo con: python3 -m uvicorn app.main:app${N}"
  exit 1
fi
echo -e "${V}✓ Servidor activo${N}"

echo -e "\n${A}[1] Login como $USER...${N}"
TOKEN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$USER&password=$PASS" | \
  python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo -e "${R}✗ No se pudo obtener token (¿existe $USER/$PASS?)${N}"
  exit 1
fi
echo -e "${V}✓ Token obtenido${N}"
AUTH="Authorization: Bearer $TOKEN"

probar_get() {
  local nombre="$1"; local ruta="$2"; local con_auth="$3"
  if [ "$con_auth" = "auth" ]; then
    RESP=$(curl -s -H "$AUTH" "$BASE$ruta")
  else
    RESP=$(curl -s "$BASE$ruta")
  fi
  COUNT=$(echo "$RESP" | python3 -c "
import sys,json
try:
    d=json.load(sys.stdin)
    if isinstance(d,list): print(f'{len(d)} registros')
    elif isinstance(d,dict):
        if 'detail' in d: print('ERROR: '+str(d['detail']))
        else: print('ok (objeto)')
    else: print('ok')
except: print('respuesta no-JSON')
" 2>/dev/null)
  if [[ "$COUNT" == ERROR* ]]; then
    echo -e "  ${R}✗ $nombre → $COUNT${N}"
  else
    echo -e "  ${V}✓ $nombre → $COUNT${N}"
  fi
}

echo -e "\n${A}[2] Probando endpoints de LECTURA...${N}"
probar_get "Barberos"        "/barberos"            auth
probar_get "Servicios"       "/servicios"           auth
probar_get "Clientes"        "/clientes"            auth
probar_get "Turnos"          "/turnos"              auth
probar_get "Usuarios"        "/usuarios"            auth
probar_get "Mi perfil"       "/usuarios/yo"         auth
probar_get "Configuracion"   "/configuracion"       noauth
probar_get "Categorias"      "/categorias"          noauth
probar_get "Proveedores"     "/proveedores"         auth
probar_get "Productos"       "/productos"           auth
probar_get "Stock bajo"      "/productos/stock-bajo" auth
probar_get "Compras"         "/compras"             auth
probar_get "Ventas"          "/ventas"              auth
probar_get "Gastos caja"     "/caja/gastos"         auth
probar_get "Descuentos caja" "/caja/descuentos"     auth
probar_get "Cierres caja"    "/caja/cierres"        auth
probar_get "Valoraciones"    "/valoraciones"        noauth
probar_get "Notificaciones"  "/notificaciones/mias" auth
probar_get "Carrusel"        "/contenido/carousel"  noauth
probar_get "Fotos"           "/contenido/fotos"     noauth
probar_get "Acontecimientos" "/acontecimientos"     auth
probar_get "Cumple hoy"      "/acontecimientos/cumpleanos/hoy" auth
probar_get "QR"              "/qr"                  auth
probar_get "Disponibilidad"  "/horarios/disponibilidad/1?fecha=2026-06-24" noauth

echo -e "\n${A}[3] Probando seguridad (sin token = 401)...${N}"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/usuarios")
if [ "$CODE" = "401" ]; then
  echo -e "  ${V}✓ /usuarios sin token → 401 (protegido)${N}"
else
  echo -e "  ${R}✗ /usuarios sin token → $CODE${N}"
fi

echo -e "\n============================================"
echo -e "${V}  PRUEBA COMPLETA${N}"
echo "============================================"
