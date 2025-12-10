#!/bin/bash
ROOT=root
PASSWORD=litemall123456
BASE_DIR="$(cd "$(dirname "$0")"/.. && pwd)"
if test -z "$PASSWORD"; then
  echo "请设置云服务器MySQL的root账号密码"
  exit 1
fi
mkdir -p "$BASE_DIR/litemall/backup"
TS=$(date +%Y%m%d_%H%M%S)
OUT="$BASE_DIR/litemall/backup/litemall_$TS.sql"
docker exec mysql sh -c "mysqldump -uroot -p\"$PASSWORD\" --databases litemall" > "$OUT"
