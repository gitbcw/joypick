#!/bin/bash

# 本脚本的作用是重置部署环境
# 1.重置数据库
# 2.删除storage文件夹内文件
# 3.调用deploy.sh启动服务
# 注意：由于1和2的原因，请仅在开发测试阶段使用本脚本！

# 重置数据库
# i. 请在`XXXXXX`处设置相应的root密码
# ii. 同时请注意root密码放在脚本是非常危险的，因此这里仅仅是用于开发测试阶段。
ROOT=root
PASSWORD=litemall123456
BASE_DIR="$(cd "$(dirname "$0")"/.. && pwd)"

if test -z "$PASSWORD"
then
  echo "请设置云服务器MySQL的root账号密码"
  exit 1
fi

# 确保持久化目录存在
mkdir -p "$BASE_DIR/litemall/storage" "$BASE_DIR/litemall/logs" "$BASE_DIR/litemall/backup"
# 删除storage文件夹内文件（仅开发/测试）
rm -f "$BASE_DIR/litemall/storage"/* || true

cd "$BASE_DIR" || exit 3
compose() {
  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    echo "docker compose not installed" >&2
    exit 1
  fi
}
compose down
compose build
docker image prune -f

# 删除db/data文件夹内文件重置数据
# 这样docker启动时会自动运行db/init-sql脚本，导入新的数据
cd "$BASE_DIR/db/data" || exit 1
rm -rf ./**

cd "$BASE_DIR" || exit 3
compose up -d
