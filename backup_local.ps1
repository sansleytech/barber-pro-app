# Script de backup manual de la base de datos de producción.
# Guarda el respaldo en la carpeta "backups" con la fecha de hoy.

$fecha = Get-Date -Format "yyyy-MM-dd"
$carpeta = "backups"
if (!(Test-Path $carpeta)) { New-Item -ItemType Directory -Path $carpeta }

$archivo = "$carpeta\backup_$fecha.sql"

# Reemplazá estos 5 valores con los datos de la conexión PÚBLICA de Railway
$host_db = "127.0.0.1"
$puerto = "60703"
$usuario = "root"
$password = "gASbaYSXvnAAIFahcMqbUKfHFJWyHGVr"
$basedatos = "railway"

& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -h $host_db -P $puerto -u $usuario -p"$password" $basedatos > $archivo

Write-Host "Backup guardado en: $archivo"