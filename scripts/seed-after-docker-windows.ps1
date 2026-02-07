Param(
  [string]$DbService = "db",
  [string]$DbName = "energy_contracts",
  [string]$DbUser = "postgres",
  [string]$SeedPath = "/docker-entrypoint-initdb.d/seed.sql"
)

$composeCmd = "docker"
$composeArgs = @("compose")

try {
  & $composeCmd @composeArgs version | Out-Null
} catch {
  if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
    $composeCmd = "docker-compose"
    $composeArgs = @()
  } else {
    Write-Error "Docker Compose not found. Install Docker Desktop or docker-compose."
    exit 1
  }
}

& $composeCmd @composeArgs up -d $DbService

Write-Host "Waiting for Postgres to accept connections" -NoNewline
while ($true) {
  try {
    & $composeCmd @composeArgs exec -T $DbService pg_isready -U $DbUser -d $DbName | Out-Null
    if ($LASTEXITCODE -eq 0) { break }
  } catch {}
  Write-Host "." -NoNewline
  Start-Sleep -Seconds 1
}
Write-Host ""

& $composeCmd @composeArgs exec -T $DbService psql -U $DbUser -d $DbName -f $SeedPath
Write-Host "Seed applied."
