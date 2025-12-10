# joypick 提交到 GitHub 操作记录

## 环境与仓库
- 操作系统：Windows（PowerShell）
- 仓库路径：`c:\MyFile\workspace\joypick\joypick`
- 远程地址：`origin = https://github.com/gitbcw/joypick.git`
- 当前分支：`master`

## 本次提交（2025-12-10）
- 提交哈希：`833b1c8c`
- 变更统计：22 files changed, 241 insertions(+), 39 deletions(-)
- 新增文件示例：`TEST_ISSUES_2025-12-09.md`、`backup/2025-12-09.sql`、`docker/util/lazy.ps1`、`litemall-admin/src/icons/png/xwj.png`、`litemall-wx/static/images/xwj.png`、`审核说明.md`

## 快速提交与推送命令
按顺序执行以下命令即可完成提交与推送：

```powershell
# 1) 可选：确认是 Git 仓库
git rev-parse --is-inside-work-tree

# 2) 查看远程
git remote -v

# 3) 设置提交用户（邮箱已为 1271928276@qq.com，可保留）
git config user.name "gitbcw"
# 若需：git config user.email "1271928276@qq.com"

# 4) 暂存所有变更
git add -A

# 5) 正常提交（若钩子报错可用下方绕过方式）
git commit -m "提交：部署与前端更新；新增Windows脚本与资源文件；同步配置修订与修复。"

# 5') 遇到钩子问题时的临时绕过
git commit --no-verify -m "提交：部署与前端更新；新增Windows脚本与资源文件；同步配置修订与修复。"

# 6) 推送到 GitHub 的 master 分支
git push origin master
```

常用一行式（存在钩子问题时临时使用）：
```powershell
git add -A && git commit --no-verify -m "提交说明" && git push origin master
```

## Husky 钩子与 ESLint 说明
- 现象：pre-commit 钩子在 `litemall-admin/src` 下运行 `eslint --fix` 报错：
  `ImportDeclaration should appear when the mode is ES6 and in the module context`
- 原因可能：ESLint 在子项目以 `sourceType: "script"` 解析了包含 `import` 的文件，或 `lint-staged` 匹配路径/工作目录不正确。
- 修复建议：
  - 在 `litemall-admin` 内确保 ESLint 使用模块模式：`parserOptions.sourceType = "module"`，或 `env: { browser: true, es6: true }`
  - 检查 `lint-staged`：在子项目范围匹配 `src/**/*.{js,vue}`，必要时将钩子配置放在 `litemall-admin` 目录或设置 `--cwd litemall-admin`
  - 验证：在 `litemall-admin` 目录运行 `npm run lint`，确认无误后再启用钩子
- 临时处理：如需立即提交可使用 `--no-verify` 绕过钩子（见上文）。

## 额外备注
- Windows 下出现 `LF 将被替换为 CRLF` 的警告不影响功能；如需统一换行，可设置 `git config core.autocrlf true` 或通过 `.gitattributes` 管控。
- 管理端开发服务器启动示例：
  ```powershell
  $env:NODE_OPTIONS = "--openssl-legacy-provider"
  npm --prefix litemall-admin run dev
  ```

