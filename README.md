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
- 老元数据没有更新时间时使用原历史时间；未知时间排在已知时间之后，相同时间按稳定路径/原索引兜底，并不声称数组位置代表更新先后。新迁移不会把资产创建时间伪装为引用加入时间，也不会将读取时间写成历史时间。已有旧版本的 `asset-created` 推断记录保留以兼容。
- 首次缺失记录沿用每路径最多 100 条提交历史的迁移（4 路并发、锚定读取的分支 HEAD）；长历史的创建时间可能只是这一页的最早记录。迁移网络失败保留 unknown/null，不写当前时间。并发 HEAD 变化时跳过旧快照迁移，下一次读取重试；损坏元数据停止写入，避免覆盖历史。
- **外部修改限制：**不新增全库历史重扫/后台对账；已有元数据的外部 Git 提交尚不能自动更新排序时间，外部引用新增/编辑若无法匹配记录则时间未知。应用不支持同名路径覆盖上传（仍明确拒绝），不虚构更新时间。外部同路径图片内容变更刷新后会读取新 blob SHA，仅 `<img src>` 添加版本参数以刷新缓存；复制的 Raw URL 与存储的 JSON URL 完全不改。
- 验证：`node tests/update-times.cjs`、`node tests/library-append.cjs`、`node tests/async-submit.cjs`；浏览器夹具 `tests/update-times-fixture.html` 只使用合成数据，不连接或写入 GitHub。
