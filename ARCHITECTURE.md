# 技术架构概览

- 技术栈：Spring Boot 2.1.x、MyBatis/PageHelper、Shiro（管理端）、JWT（小程序端）、Druid、Swagger、Vue 2、微信小程序
- 多模块后端（Maven）+ 多前端子工程（Web 管理端、微信小程序两套）
- 运行模式：独立服务（`admin-api`、`wx-api`）或聚合服务（`all`/`all-war`）

## 模块划分

- 后端模块（Maven 根 `pom.xml:22–29`）
  - `litemall-core`：公共组件与配置（Web、存储、短信、微信 SDK）（`litemall-core/pom.xml:24–47`）
  - `litemall-db`：数据库访问层（MyBatis、Mapper XML、领域模型）（`litemall-db/src/main/resources/...`）
  - `litemall-wx-api`：微信小程序后端（`db, core, wx`）（`litemall-wx-api/src/main/resources/application.yml:1–8`）
  - `litemall-admin-api`：管理后台后端（`db, core, admin`）（`litemall-admin-api/src/main/resources/application.yml:1–8`）
  - `litemall-all`：聚合服务，整合 `admin + wx`（`litemall-all/src/main/resources/application.yml:1–12`）
  - `litemall-all-war`：聚合服务的 WAR 打包
- 前端模块
  - `litemall-admin`：Web 管理端（Vue 2 + ElementUI），开发端口 `9527`，代理到 `admin-api`
  - `litemall-wx`：微信小程序（主线实现，`config/api.js:1–16`）
  - `renard-wx`：微信小程序（另一套实现，`renard-wx/config/api.js:1–6`）
  - `litemall-vue`：H5/PC 端示例工程

## 端口与运行

- 管理后台后端：`8083`（`litemall-admin-api/src/main/resources/application.yml:7–8`）
- 小程序后端：`8082`（`litemall-wx-api/src/main/resources/application.yml:7–8`）
- 聚合后端：`8080`（`litemall-all/src/main/resources/application.yml:11–12`）
- 管理前端（开发）：`9527`（`litemall-admin/vue.config.js:31–37`）

## 配置与环境

- Spring Profiles：
  - 管理端：`db, core, admin`（`litemall-admin-api/src/main/resources/application.yml:1–3`）
  - 小程序端：`db, core, wx`（`litemall-wx-api/src/main/resources/application.yml:1–3`）
  - 聚合端：`db, core, admin, wx`（`litemall-all/src/main/resources/application.yml:1–3`）
- 数据源（Druid）：本地连接 `jdbc:mysql://localhost:3306/litemall`（`litemall-db/src/main/resources/application-db.yml:7–13`）
- Swagger：`production: false` 默认开启文档（各模块 `application.yml`）

## 认证与安全

- 管理端认证（Shiro）
  - 过滤器链定义：匿名接口与受保护的 `/admin/**`（`litemall-admin-api/src/main/java/.../config/ShiroConfig.java:28–44`）
  - 会话管理与 Realm（`litemall-admin-api/src/main/java/.../config/ShiroConfig.java:22–25, 47–59`）
  - 前端请求头：`X-Litemall-Admin-Token`（`litemall-admin/src/utils/request.js:18–21`）
- 小程序端认证（JWT + Token）
  - 前端请求头：`X-Litemall-Token`（`litemall-wx/utils/util.js:31–34`）
  - 登录/注册接口（`litemall-wx-api/src/main/java/.../web/WxAuthController.java:59–108, 209–249`）

## 存储与第三方集成

- 对象存储：阿里云 OSS、腾讯 COS、七牛（依赖于 `litemall-core`，可在配置中切换）
- 微信集成：`weixin-java-miniapp`、`weixin-java-pay`（`root pom.xml:98–108`）
- 短信与邮件：`qcloudsms`、`spring-boot-starter-mail`（`root pom.xml:110–144`）

## 数据库与表

- 初始化 SQL：
  - 架构与用户：`litemall-db/sql/litemall_schema.sql`
  - 表结构：`litemall-db/sql/litemall_table.sql`
  - 示例数据：`litemall-db/sql/litemall_data.sql`
- Mapper XML 与实体：`litemall-db/src/main/resources/org/linlinjava/litemall/db/dao/*`

## 前后端交互

- 管理端前端 → 管理端后端：
  - 开发代理：`/admin` 代理至 `http://localhost:8083`（`litemall-admin/vue.config.js:34–37`）
  - 令牌头：`X-Litemall-Admin-Token`（`litemall-admin/src/utils/request.js:19–21`）
- 小程序前端 → 小程序后端：
  - API 根地址：`var WxApiRoot = 'http://127.0.0.1:8082/wx/'`（`litemall-wx/config/api.js:1–16`）
  - 分类接口：`CatalogList`、`CatalogCurrent`（`litemall-wx/config/api.js:15–16`）

## 构建与启动

- 后端构建
  - 管理端：`mvn -pl litemall-admin-api -am -DskipTests package`
  - 小程序端：`mvn -pl litemall-wx-api -am -DskipTests package`
  - 聚合端：`mvn -pl litemall-all -am -DskipTests package`
- 后端启动
  - 管理端：`java -jar litemall-admin-api/target/litemall-admin-api-0.1.0-exec.jar`
  - 小程序端：`java -jar litemall-wx-api/target/litemall-wx-api-0.1.0-exec.jar`
  - 聚合端：`java -jar litemall-all/target/litemall-all-0.1.0-exec.jar`
- 前端启动（管理端）
  - 安装：`npm --prefix litemall-admin install --registry=https://registry.npmmirror.com --legacy-peer-deps`
  - 开发：`$env:NODE_OPTIONS="--openssl-legacy-provider"; npm --prefix litemall-admin run dev`

## 部署与容器

- Docker 目录：`docker/`，含数据库与应用镜像配置（`docker/docker-compose.yml`）
- 部署脚本：`deploy/bin/*` 与 `docker/bin/*`（打包、重置、部署）
- 线上示例配置：`deploy/litemall/application.yml`

## 关键设计与约束

- 分层设计：Controller（接口）→ Service（业务）→ DB（MyBatis Mapper）
- 领域模型围绕电商：用户、商品、订单、购物车、优惠券、专题、售后等（`litemall-db/src/main/java/.../domain/*`）
- 任务与调度：订单超时、团购过期等任务（`litemall-admin-api/src/main/java/.../task/*`、`litemall-wx-api/src/main/java/.../task/*`）
- 日志与审计：管理端操作日志（`litemall-admin-api/src/main/java/.../service/LogHelper.java`）

## 常见开发问题

- 端口不一致导致联通失败：确保前端 `api.js` 与后端端口一致（`8082` 小程序，`8083` 管理端，`8080` 聚合）
- 本地联调优先使用 `127.0.0.1` 替代 `localhost`，避免 IPv6 解析差异
- Vue 2 + webpack4 与新 Node 的兼容：设置 `NODE_OPTIONS=--openssl-legacy-provider`

---

如需补充更细的模块依赖图、数据库 ER 图或接口清单，可在 `doc/` 中扩展专题文档（现有：`doc/project.md`、`doc/api.md`、`doc/database.md`）。
