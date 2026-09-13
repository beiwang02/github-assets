# GitHub 图床 Web 控制台

一个基于 GitHub 仓库管理图片、分组和 JSON 图标库的轻量控制台。图片与 JSON 始终存放在用户自己的 GitHub 仓库；服务端不保存业务资源。

源码仓库：[beiwang02/github-assets](https://github.com/beiwang02/github-assets)

## 功能

- GitHub 经典 Token 登录，可选“记住此设备”
- 自动识别兼容结构的图片仓库，也可创建或手动选择仓库
- 管理 JSON 图标库、图片资源和图片分组
- 上传、改名、删除图片时自动同步 JSON 引用
- 多选图片批量加入 JSON 或批量删除
- GitHub SHA 冲突保护和原子 Git 提交
- 管理员访问名单与仓库自动恢复（均为可选）
- 深色、浅色、跟随系统三种外观；适配移动端

## 数据流

1. 用户在浏览器输入 GitHub Token。
2. 服务端仅在内存会话中使用 Token 代理 GitHub API 请求。
3. 图片、JSON、分组和 Git 提交全部写入用户自己的 GitHub 仓库。
4. 服务端重启或用户退出后，会话 Token 失效；不会保存到数据库或业务文件。

## GitHub Token 权限

本项目使用 **经典 Personal Access Token（classic）**。

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
  "name": "我的图标库",
  "description": "常用图标",
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

普通用户不需要使用管理员的旧仓库。管理员配置只用于限制网站访问或自动恢复管理员自己的仓库：

```env
ADMIN_GITHUB_LOGIN=你的GitHub用户名
ALLOWED_GITHUB_LOGINS=

# 可选：管理员登录后自动恢复的仓库
# ADMIN_RESTORE_REPO=你的旧图床仓库名
```

- `ADMIN_GITHUB_LOGIN`：管理员 GitHub 用户名。
- `ALLOWED_GITHUB_LOGINS`：逗号分隔允许名单；留空表示所有登录用户可访问。
- `ADMIN_RESTORE_REPO`：仅管理员使用的可选默认仓库，不是项目固定仓库。

## 文件说明

- `server.mjs`：Token 会话、GitHub API 代理和静态服务
- `github.js`：GitHub 仓库读取、图片/JSON/分组操作和原子提交
- `console.js`：控制台页面交互
- `compose.yaml`、`Dockerfile`、`install.sh`：Docker Compose 部署
- `deploy/README.md`：域名反向代理和高级部署说明
