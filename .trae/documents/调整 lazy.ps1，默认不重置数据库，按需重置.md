## 背景结论
- 根因：`docker/util/lazy.ps1` 在远端强制执行 `docker/bin/reset.sh`，该脚本会清空 `docker/db/data`，触发 MySQL 容器按挂载的 `./db/init-sql` 重新初始化数据库。
- 证据：
  - `docker/util/lazy.ps1:47` 调用 `./reset.sh`
  - `docker/bin/reset.sh:45` 执行 `rm -rf ./**`（定位在 `db/data` 目录）
  - `docker/docker-compose.yml:14-15` 将 `./db/data` 和 `./db/init-sql` 分别挂载到 MySQL 数据目录与初始化目录
- 结论：当前“每次上传”都相当于重置库，适用于开发测试，生产不应默认发生。

## 改进目标
- 将“上传/部署”与“数据库重置”解耦，默认仅部署，不触碰数据。
- 提供显式开关与环境防护，确保只有在开发环境、且明确需要时才重置。
- 增加重置前备份与回滚手段，降低数据风险。

## 具体修改点
1. lazy.ps1 增加参数与默认行为
- 新增参数：`-ResetDb`（默认 `false`），`-Env`（默认 `dev`）。
- 默认执行远端 `deploy.sh`；当且仅当 `-ResetDb:$true` 且 `Env=dev` 时执行 `reset.sh`。
- 输出提示与二次确认（仅在交互模式下），避免误触发。

2. reset.sh 增强安全与可控性
- 增加 `ENV` 检测：`ENV=prod` 时直接退出并提示禁止重置。
- 将“清空数据目录”下沉为可选参数 `--wipe`；默认不清空，仅在开发场景需要全量重置时使用。
- 默认路径改为“受控重置”：通过 `docker exec mysql` 执行脚本，实现仅重建目标库（开发用），不动其他系统库与用户自建库。

3. 备份与回滚
- 新增 `backup.sh`（或在 `reset.sh` 执行前置备份）：
  - 使用 `mysqldump` 备份目标库至 `litemall/backup`，文件名带时间戳。
  - 备份成功后再继续重置流程；失败则中止。
- 文档化回滚：提供 `restore.sh` 依据最新备份恢复。

4. 部署脚本对齐
- 保留现有 `deploy.sh` 的无数据操作流程（`compose down/build/up`），确保常规发布不影响数据。
- 处理 CRLF：继续沿用 `tr -d '\r'`，保证远端执行无行尾问题。

## 验证方案
- 在开发环境：
  - 先插入测试数据；运行 `lazy.ps1 -ResetDb:$false`，验证数据仍在。
  - 再运行 `lazy.ps1 -ResetDb:$true -Env dev`，验证数据被重置且按 `init-sql` 重新导入。
- 在“模拟生产”环境：
  - 设置 `ENV=prod`；运行 `-ResetDb:$true`，验证脚本拒绝执行重置。
- 观察容器与卷：确认非重置路径不触发 `db/data` 清空。

## 风险与注意
- 误触发重置的主要风险在生产；通过参数默认关闭、环境硬闸与交互确认三重保障降低风险。
- 受控重置需确保 SQL 脚本可重复执行（幂等/先 DROP 后 CREATE）；必要时调整初始化脚本。
- 备份依赖远端权限与磁盘空间，需提前确认配额。

## 迁移与文档
- 更新 README/部署文档：标注默认行为与参数用法，明确生产禁止重置。
- 给出常见命令示例：
  - 常规上传：`lazy.ps1 -ResetDb:$false`
  - 开发重置：`lazy.ps1 -ResetDb:$true -Env dev`
  - 生产上传：`lazy.ps1 -Env prod -ResetDb:$false`
