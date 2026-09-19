# GitHub 图床

一个基于 GitHub 仓库管理图片、分组和 JSON 库的轻量 Web 控制台。图片与 JSON 始终存放在用户自己的 GitHub 仓库；服务端不保存业务资源。

## 功能

- GitHub Token 登录，可选“记住此设备”
- 自动识别兼容结构的图片仓库，也可创建或手动选择仓库
- 管理 JSON 库、图片资源和图片分组
- 上传、改名、删除图片时自动同步 JSON 引用
- 多选图片批量加入 JSON 或批量删除
- GitHub SHA 冲突保护和原子 Git 提交
- 管理员访问名单等可选功能，按需配置
- 深色、浅色、跟随系统三种外观；适配移动端

## 数据流

1. 用户在浏览器输入 GitHub Token。
2. 服务端仅在内存会话中使用 Token 代理 GitHub API 请求。
3. 图片、JSON、分组和 Git 提交全部写入用户自己的 GitHub 仓库。
4. 服务端重启或用户退出后，会话 Token 失效；不会保存到数据库或业务文件。

## GitHub Token 权限

本项目推荐使用 **经典 Personal Access Token（classic）**。

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**。
2. 选择 **Generate new token (classic)**，设置合理有效期。
3. 权限仅勾选：`repo → public_repo`。
4. 其他权限不需要勾选。生成后复制 Token，在网站登录页粘贴使用。

> Token 能修改你授权范围内的公开仓库。请只在 HTTPS 网站和可信设备使用；不再使用时可在 GitHub 立即撤销。

## 资源仓库结构

项目兼容已有的 `assets/` 或 `icons/` 图片目录，并读取所有包含 `icons` 数组的 JSON 文件。新建资源时建议使用下面的结构：

```text
assets/
  emby/
    netflix.png
    iris.png
json/
  library.json
```

`json/library.json` 示例：

```json
{
  "name": "我的 JSON 库",
  "description": "常用图片",
  "icons": [
    {
      "name": "Netflix",
      "url": "https://raw.githubusercontent.com/owner/repo/main/assets/emby/netflix.png"
    }
  ]
}
```

## 部署

服务内外统一使用 `8765` 端口。部署成功后访问：

```text
http://服务器IP:8765
```

### 一键安装（Ubuntu / Debian）

```bash
git clone https://github.com/beiwang02/github-assets.git
cd github-assets
chmod +x install.sh
sudo ./install.sh
```

脚本会安装 Docker（如未安装），将项目复制至 `/opt/stacks/github-assets`，再通过 Docker Compose 构建并启动服务。

### Compose 编排

根目录的 [`compose.yaml`](compose.yaml) 提供单容器编排：

```yaml
services:
  github-assets:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: github-assets
    restart: unless-stopped
    env_file:
      - .env
    environment:
      HOST: 0.0.0.0
      PORT: 8765
    ports:
      - "${GITHUB_IMAGE_HOST_BIND:-0.0.0.0}:${GITHUB_IMAGE_HOST_PORT:-8765}:8765"
    volumes:
      - access-policy:/app/data
    read_only: true
    security_opt:
      - no-new-privileges:true

volumes:
  access-policy:
    name: github-image-host-access-policy
```

- `8765:8765`：宿主机和容器均使用 `8765` 端口。
- `access-policy`：仅保存管理员访问策略，不保存图片、JSON 或 Token。
- `read_only` 与 `no-new-privileges`：限制容器运行权限。

### 手动 Docker Compose 部署

```bash
git clone https://github.com/beiwang02/github-assets.git
cd github-assets
cp .env.example .env
docker compose up -d --build
```

常用命令：

```bash
# 查看状态
docker compose ps

# 查看日志
docker compose logs -f github-assets

# 更新版本
git pull origin main
docker compose up -d --build --force-recreate
```

默认不需要修改 `.env`。域名反向代理、访问名单等高级配置见 [`deploy/README.md`](deploy/README.md)。

## 管理员配置（可选）

管理员配置只用于按需控制网站访问；仓库会按项目规则自动检测，无需额外指定环境变量：

```env
ADMIN_GITHUB_LOGIN=你的GitHub用户名
ALLOWED_GITHUB_LOGINS=
```

- `ADMIN_GITHUB_LOGIN`：可选的管理员 GitHub 用户名；不配置不影响普通使用。
- `ALLOWED_GITHUB_LOGINS`：可选的逗号分隔允许名单；留空表示所有登录用户可访问。

## 文件说明

- `server.mjs`：Token 会话、GitHub API 代理和静态服务
- `github.js`：GitHub 仓库读取、图片/JSON/分组操作和原子提交
- `console.js`：控制台页面交互
- `compose.yaml`、`Dockerfile`、`install.sh`：Docker Compose 部署
- `deploy/README.md`：域名反向代理和高级部署说明

## UI Refresh 正式版

当前界面版本 `ui-refresh-18`，沿用原生业务与认证。测试夹具与生产隔离，范围及验证限制见 [发布说明](README-UI-REFRESH.md)。

图片网格保持手机 3 列、桌面 6 列，图片按方板的 72% 居中 contain；资源与 JSON 详情共用手机 160px / 桌面 200px 紧凑方板。概览库行直接进入对应库，工作区库信息使用 Floating UI 切换器。

## 最近更新排序与时间边界

- `newest` 排序键及原 localStorage 设置不变；界面称为“最近更新”。图片使用 `updatedAt → createdAt`，引用使用 `updatedAt → addedAt`。最早上传/加入仍用原始 `createdAt` / `addedAt`，修改不会重置历史加入时间。
- 上传、加入引用、编辑引用、图片/分组改名均在同一原子提交中记录实际变更时间；改名同步关联引用和库的更新时间。未变化的保存、重复加入或空删除不提交、不刷新时间；分组改名不触碰无关库。
- 概览各库封面独立取最近更新的 3 项，不受工作区排序影响；最近图片取最新 6 项，概览库按更新时间排列。仅排序副本，JSON 原始数组顺序、公开字段及编辑/删除原索引保持不变。
- 打开并连接仓库时读取；返回页面（focus/pageshow/visibility）去抖 250ms 后检查；页面可见时约每 60 秒检查，手动刷新立即检查。隐藏或关闭页面不运行；不是服务器后台任务。未变 HEAD 只查询分支引用，变化后复用 SHA 相同的 JSON blob 和路径时间缓存。
- 同步只发 GET，不迁移或写回 `.github-assets-meta.json`，不自动创建目录。新建仓库使用 GitHub auto_init；真正没有提交的空仓库只在用户主动创建分组/库或上传时初始化。读取空仓库仍检查分支引用，不依赖可能滞后的 size=0，能发现外部首次提交。
- 模态框、设置页、加载、待提交操作或全局写锁期间后台刷新暂停；请求中途进入这些状态也不重绘。保留仍存在的图片选择；库内容 SHA 变化时清理不再可靠的引用索引选择。仓库切换、退出后的旧响应不能覆盖当前界面；并发刷新共用请求，只保留一个后续定时器。
- 每个变化路径最多读取 3×100 条提交记录；每个 JSON 库每轮最多读取 30 个历史版本内容。不是整个仓库只有 30 次请求；大量变化路径仍可能触发限流。时间来自提交 committer 日期，非文件系统时钟；GitHub path 历史不可靠跟随重命名，创建时间可能仅指当前路径这一段历史。300 条截断时创建时间未知（已有已知创建时间保留）。
- 引用按相同 name/url 的出现次序匹配，只有无歧义 name 或 URL 单项编辑继承身份；无法可靠回溯、超预算或历史 API 错误时新增引用时间为 unknown/null，保留可匹配的已知时间，不伪造当前时间。外部 URL 目标本身的内容变化不可检测。未知时间排在已知之后，平局按稳定路径/原索引；JSON 数组顺序、公开 schema、复制 URL 都不变。
- 损坏的 `json/` JSON、已识别库或元数据显式报告文件路径，保留最后成功快照；无关路径的非库 JSON 解析失败不阻断。后台失败通过状态说明和轻提示反馈，不清空已有界面；历史 API 失败降级未知时间。外部同路径图片替换采用最新 blob SHA，仅显示 `<img src>` 添加缓存参数。
- 验证：`node tests/external-sync.cjs`、`node tests/sync-boundaries.cjs`、`node tests/update-times.cjs`、`node tests/library-append.cjs`、`node tests/async-submit.cjs`。边界测试在隔离 VM 执行生产函数，使用确定性假时钟/请求，不向真实 GitHub 写入；不是完整真实浏览器交互矩阵。
