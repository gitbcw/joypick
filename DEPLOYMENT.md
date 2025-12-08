# 部署指南（现有方案与可优化方案）

## 概览

- 项目为多模块后端（Spring Boot + MyBatis）与多前端（Vue 管理后台、H5、小程序），既支持手工部署也支持 Docker Compose。
- 管理后台后端常用于开发的端口 `8083`，小程序后端 `8082`，聚合后端（`litemall-all`）默认 `8080`；生产部署通常以聚合后端 `8080` 为入口并通过 Nginx 做 HTTPS 反向代理。
- 数据库使用 `MySQL 5.7`，提供完备的初始化 SQL 与外部化 `application.yml` 配置。

## 现有部署方案

### 手工 Jar 部署（deploy 包）

- 打包与目录结构：脚本将数据库、前端与后端产物整理到 `deploy/` 目录，便于上传到服务器统一部署。
  - 打包脚本：`deploy/util/package.sh`（c:\MyFile\workspace\joypick\joypick\deploy\util\package.sh:14–31）。
  - 运行脚本：
    - 停止并启动服务：`deploy/bin/deploy.sh`（c:\MyFile\workspace\joypick\joypick\deploy\bin\deploy.sh:4–12）。
    - 重置环境（导入 DB、清理存储、重新部署）：`deploy/bin/reset.sh`（c:\MyFile\workspace\joypick\joypick\deploy\bin\reset.sh:21–32）。
  - 说明文档：`deploy/README.md`（c:\MyFile\workspace\joypick\joypick\deploy\README.md:48–67, 97–104）。

- 外部配置：`deploy/litemall/application.yml`（用于覆盖 Jar 内部配置，设置数据库、存储、端口等）。

### Docker Compose 部署（docker 包）

- 组合服务：`docker/docker-compose.yml` 定义 `mysql57` 与 `litemall` 两个服务，端口分别映射 `3306` 与 `8080`。
  - Compose 文件：`docker/docker-compose.yml`（c:\MyFile\workspace\joypick\joypick\docker\docker-compose.yml:3–18, 19–35）。
  - 应用镜像：`docker/litemall/Dockerfile`（c:\MyFile\workspace\joypick\joypick\docker\litemall\Dockerfile:1–4），以 `openjdk:8-jre` 运行 `litemall.jar`。
  - 外部配置：`docker/litemall/application.yml`（c:\MyFile\workspace\joypick\joypick\docker\litemall\application.yml:1–15, 25–37, 119–148），包含数据库、分页、存储等设置。

- 打包产物生成：
  - 一键打包：`docker/util/package.sh`（c:\MyFile\workspace\joypick\joypick\docker\util\package.sh:14–31）将前端编译与后端打包结果复制到 `docker/`。
  - 一键远程部署：`docker/util/lazy.sh`（c:\MyFile\workspace\joypick\joypick\docker\util\lazy.sh:32–50）支持打包、上传、远程执行 reset（含 CRLF → LF 转换）。

### 反向代理（HTTPS）

- 示例 Nginx 配置：`doc/conf/nginx.conf`（c:\MyFile\workspace\joypick\joypick\doc\conf\nginx.conf:61–78, 80–84），`443` 监听代理到 `http://localhost:8080`，`80` 强制跳转到 HTTPS。

### CI（可扩展）

- 现有 GitHub Actions：
  - 后端 Maven 构建与验证：`.github/workflows/main.yml`（c:\MyFile\workspace\joypick\joypick\.github\workflows\main.yml:8–32）。
  - 管理后台与 H5 前端安装与测试：同文件的 `Litemall-admin` 与 `Litemall-vue` 任务（c:\MyFile\workspace\joypick\joypick\.github\workflows\main.yml:35–69）。

## 标准部署流程

### 前置准备

- 服务器开放端口：`3306`、`8080`（或反向代理后对外暴露 `443`）。
- 安装依赖：
  - 手工部署需 `JDK 8` 与 `MySQL 5.7`。
  - Docker 部署需 `Docker` 与 `docker-compose`。

### 方案 A：Docker Compose

1. 生成部署产物（在开发机执行）：
   - 执行 `docker/util/package.sh` 完成数据库聚合与后端、前端打包。
2. 准备服务器（首次）：
   - 上传 `docker/` 目录至服务器，例如 `/home/ubuntu/docker`。
   - 根据实际环境调整 `docker/litemall/application.yml`（数据库主机名、对象存储、通知等）。
3. 启动：
   - 进入服务器目录并执行：`docker-compose up -d`。
4. 验证：
   - `http://服务器IP:8080/admin/index/index`
   - `http://服务器IP:8080/wx/index/index`
   - 如经 Nginx：`https://域名/`（反向到 `8080`）。

### 方案 B：手工 Jar

1. 生成部署产物（在开发机执行）：
   - `deploy/util/package.sh` 或手动执行 `mvn clean package`，产出 `deploy/litemall/litemall.jar`。
   - 导出数据库聚合 SQL 至 `deploy/db/litemall.sql`。
2. 准备服务器：
   - 安装 `JDK 8` 与 `MySQL 5.7`；导入 `deploy/db/litemall.sql`。
   - 配置 `deploy/litemall/application.yml`（数据库地址、端口、对象存储等）。
3. 启停与重置：
   - 启停：`deploy/bin/deploy.sh`（停止旧进程与重新启动）。
   - 重置：`deploy/bin/reset.sh`（导入 DB、清理存储后重启）。
4. 验证：同上。

## 配置与环境建议

- 外部化配置：始终优先使用外部 `application.yml` 覆盖 Jar 内配置，避免在代码库中硬编码敏感信息。
- 密钥与账号：将邮件、短信、对象存储等密钥迁移到环境变量或受控的外部配置文件；严禁提交真实密钥。
- 端口策略：
  - 开发环境常用 `8082`（小程序后端）、`8083`（管理后台后端）、`9527`（管理后台前端）。
  - 生产建议以 `litemall-all` 聚合后端统一暴露 `8080`，前置 Nginx 做 TLS 与域名管理。
- 存储与备份：通过 Compose 挂载 `./litemall/storage`、`./litemall/logs`、`./litemall/backup` 到容器以持久化数据与日志。

## 常见问题与排障

- Windows 与 Linux 换行符差异：远程脚本在 Linux 下需 LF，若来源为 Windows（CRLF），使用 `lazy.sh` 的转换段（c:\MyFile\workspace\joypick\joypick\docker\util\lazy.sh:41–49）。
- Docker 守护进程：确保 Docker Desktop 或服务已启动，否则 `docker-compose` 无法运行。
- 端口与模块混淆：开发时 `8080` 常为聚合后端，`8083` 为管理后台后端；生产建议统一入口到 `8080` 并通过路由 `/admin`、`/wx` 区分。

## 自动化部署可行性与优化建议

- 扩展 CI：在现有 GitHub Actions 基础上增加制品归档与镜像构建、推送步骤（Docker Hub 或私有 Registry），并在服务器侧用 `watchtower` 或 `docker stack` 进行滚动更新。
- 构建优化：采用多阶段 Dockerfile（第一阶段 Maven 构建，第二阶段运行时镜像），减少上传与服务器依赖；当前方案通过打包后复制 Jar，已具备稳定性，后续可按需要优化。
- 配置管理：引入 `.env` 或密钥管理（如 `docker secrets`），避免在仓库中出现真实账号信息。
- 反向代理与缓存：在 Nginx 层开启 gzip 与静态缓存，减少后端负载；参考示例配置（c:\MyFile\workspace\joypick\joypick\doc\conf\nginx.conf:33–49, 61–78）。

## 验收清单

- 服务启动：`docker-compose ps` 或 `ps -ef | grep litemall.jar` 显示运行中。
- 数据库：初始化成功，可访问商城接口返回 JSON。
- 前端管理：`http://服务器IP:8080/#/login` 可进入登录页（聚合后端打包静态资源时）。
- HTTPS：域名与证书生效，外网仅开放 `443`。

