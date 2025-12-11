# DocM 使用说明（给 AI）

目标：在 `docm` 目录内维护一个可预览的 HTML 文档系统，左侧为可折叠目录，右侧通过 iframe 展示所选文档。

目录结构：
- `docm/index.html` 主页面（加载 `catalog.json` 生成左侧目录，右侧 iframe 展示）
- `docm/catalog.json` 目录数据源（支持分组与嵌套）
- `docm/pages/` 存放所有 HTML 文档；允许子文件夹（如 `pages/test/...`）
- `docm/server.mjs` 轻量静态服务器（`node docm/server.mjs` 启动 `http://localhost:8020/`）

模板（供生成文档参考）：
- 位置：`docm/pages/templates/`
- 提供的模板：
  - `text-basic.html` 纯文字基础风格（短文说明/操作指引）
  - `text-serif.html` 纯文字杂志风格（长文更优）
  - `article-visual.html` 图文文章模板（含配图与说明）
  - `gallery.html` 图文画廊模板（多图展示）
  - `mindmap.html` 思维导图模板（纯前端渲染、可折叠节点）
  - `api-basic.html` API 文档模板（端点/参数/响应/错误码/版本）
  - `runbook.html` 运行手册模板（触发条件/诊断/处置/验证/升级）
  - `adr.html` 架构决策记录模板（背景/决策/权衡/影响/迁移）
  - `release-notes.html` 发布说明模板（新增/修复/改进/破坏性变更）
  - `changelog.html` 变更日志模板（按版本分组变更）
  - `architecture-overview.html` 架构综述模板（模块/依赖/数据流/部署）
  - `rfc.html` 提案模板（问题/背景/方案/替代/影响/开放问题）
使用方式：复制模板为新文件并替换标题与正文内容，必要时保留结构与样式以统一呈现。

添加文档：
1. 在 `docm/pages/` 下新增 HTML 文件或子目录（示例：`docm/pages/guide/getting-started.html`）
2. 在 `docm/catalog.json` 中添加目录项：
   - 叶子项（展示页面）：`{"id":"doc-id","title":"标题","path":"pages/guide/getting-started.html"}`
   - 分组项（可折叠）：`{"id":"group-id","title":"分组名","children":[...子项...]}`

自动目录：
- 服务器启动会扫描 `docm/pages`，生成 `catalog.json`，目录按“文件夹名/文件名”组织；如需固定排序，可后续扩展字段。

渲染与约定：
- 右侧用 iframe 加载 `path` 指向的 HTML，页面中的样式与脚本按自身相对路径解析；与主页面样式隔离。
- 支持中文文件名；服务器会对 URL 进行解码后读取文件。
- 地址栏哈希 `#pages/...` 与当前选中项保持同步。

验证：
- 启动：`node docm/server.mjs` → 打开 `http://localhost:8020/`
- 左侧点击目录项应在右侧完整展示文档内容。

注意：
- 不监听 `docs/*.md`；所有文档直接以 HTML 维护。
- 不记录更新时间或标签（可在后续按需扩展 `catalog.json` 字段）。
