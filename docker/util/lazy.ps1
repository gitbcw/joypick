Param(
  [string]$Remote = 'root@47.107.151.70',
  [string]$KeyPath = "$env:USERPROFILE\.ssh\joypick_ed25519"
)
$ErrorActionPreference = 'Stop'
$ssh = Get-Command ssh -ErrorAction SilentlyContinue
$scp = Get-Command scp -ErrorAction SilentlyContinue
$npmCmd = (Get-Command 'npm.cmd' -ErrorAction SilentlyContinue).Source
if (-not $npmCmd) { $npmCmd = (Get-Command 'npm' -ErrorAction SilentlyContinue).Source }
if (-not $ssh -or -not $scp) { Write-Error 'ssh/scp not found'; exit 1 }
if (-not $npmCmd) { Write-Error 'npm not found'; exit 1 }
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LITEMALL_HOME = (Resolve-Path (Join-Path $scriptDir '..\..')).Path
$schema = Join-Path $LITEMALL_HOME 'litemall-db\sql\litemall_schema.sql'
$table = Join-Path $LITEMALL_HOME 'litemall-db\sql\litemall_table.sql'
$data = Join-Path $LITEMALL_HOME 'litemall-db\sql\litemall_data.sql'
$dest = Join-Path $LITEMALL_HOME 'docker\db\init-sql\litemall.sql'
$content = (Get-Content -Raw -Encoding UTF8 $schema) + (Get-Content -Raw -Encoding UTF8 $table) + (Get-Content -Raw -Encoding UTF8 $data)
[System.IO.File]::WriteAllText($dest, $content, (New-Object System.Text.UTF8Encoding($false)))
Push-Location (Join-Path $LITEMALL_HOME 'litemall-admin')
$env:NODE_OPTIONS = '--openssl-legacy-provider'
& $npmCmd install --registry=https://registry.npmmirror.com
& $npmCmd run build:dep
Pop-Location
Push-Location (Join-Path $LITEMALL_HOME 'litemall-vue')
$env:NODE_OPTIONS = '--openssl-legacy-provider'
& $npmCmd install --registry=https://registry.npmmirror.com
& $npmCmd run build:dep
Pop-Location
Push-Location $LITEMALL_HOME
& mvn clean package -DskipTests
Pop-Location
$jar = Get-ChildItem (Join-Path $LITEMALL_HOME 'litemall-all\target') -Filter 'litemall-all-*-exec.jar' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $jar) { Write-Error 'Jar not found'; exit 2 }
Copy-Item -Force $jar.FullName (Join-Path $LITEMALL_HOME 'docker\litemall\litemall.jar')
$destSpec = $Remote + ':/root/'
& scp -i $KeyPath -r (Join-Path $LITEMALL_HOME 'docker') $destSpec
$remoteCmd = @'
mkdir -p /root/docker/litemall/storage /root/docker/litemall/logs /root/docker/litemall/backup
cd /root/docker/bin
cat deploy.sh | tr -d '\r' > deploy2.sh
mv deploy2.sh deploy.sh
chmod +x deploy.sh
cat reset.sh | tr -d '\r' > reset2.sh
mv reset2.sh reset.sh
chmod +x reset.sh
./reset.sh
'@
& ssh -i $KeyPath $Remote $remoteCmd
