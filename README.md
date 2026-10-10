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

## 可选 GitHub 授权登录配置

默认不配置 OAuth，仍可使用原 Token 登录和“记住此设备”。在 GitHub **Settings → Developer settings → OAuth Apps → New OAuth App** 创建应用：

- Homepage URL：`https://your-domain.example`
- Authorization callback URL：`https://your-domain.example/api/auth/github/callback`

以下 `https://your-domain.example` 仅为占位示例，请将所有出现位置替换为实际部署域名，并保持回调路径 `/api/auth/github/callback` 不变。仅在服务器 `.env` 中手动填写（不要提交真实密钥）：

```dotenv
PUBLIC_BASE_URL=https://your-domain.example
GITHUB_CLIENT_ID=填写应用的客户端ID
GITHUB_CLIENT_SECRET=填写应用的客户端密钥
GITHUB_OAUTH_SCOPE=public_repo
GITHUB_OAUTH_REDIRECT_URI=https://your-domain.example/api/auth/github/callback
ENABLE_TOKEN_LOGIN=true
```

`GITHUB_OAUTH_REDIRECT_URI` 可留空，由 `PUBLIC_BASE_URL` 自动生成；显式值必须同源且使用上述回调路径。客户端 ID 和密钥都配置后，登录页才显示真实 GitHub 授权入口。HTTPS 根地址决定 Secure Cookie；反向代理须保留正确域名并提供 HTTPS。

修改 `.env` 后在 `/opt/stacks/github-assets` 执行 `docker compose up -d --no-deps --force-recreate github-assets`，普通 restart 不会重新加载 env。若同时更新源码，先 `docker compose build github-assets`。保留 Token 作为回退建议维持 `ENABLE_TOKEN_LOGIN=true`。

授权后可直接管理公开资源仓库，无需另填 PAT。`public_repo` 涵盖账号可访问的公开仓库，**并非只授权一个仓库**；组织策略仍可能限制访问。OAuth 令牌只存在服务器内存，不写 localStorage、数据库或业务文件，服务重启后需重新授权；原“记住此设备”仅针对用户主动填写的 Token。可在 GitHub **Settings → Applications → Authorized OAuth Apps** 撤销授权。取消或错误会返回登录页，不会自动循环授权。

应用源码是 `https://github.com/beiwang02/github-assets`（真实项目源码链接，不是配置示例），用户图片数据仓库由用户自行选择，例如 `your-github-username/your-assets-repo`；授权登录不改变 Git remote 或用户既有仓库选择，自动识别和允许名单继续生效。

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

默认访问端口为 `8765`（可修改 `.env` 中的 `GITHUB_IMAGE_HOST_PORT`）。部署成功后访问：

```text
http://服务器IP:8765
```

### 步骤 1：安装 Docker

已安装 Docker 和 Compose 的服务器可跳过这一步。

```bash
curl -fsSL https://get.docker.com | sh
```

### 步骤 2：Docker Compose 部署

> Docker Compose 方法

以下命令在服务器的 root 终端执行，部署目录固定为 `/opt/stacks/github-assets/`。

```bash
mkdir -p /opt/stacks
git clone https://github.com/beiwang02/github-assets.git /opt/stacks/github-assets && cd /opt/stacks/github-assets && cp .env.example .env && docker compose up -d --build
```

常用命令（先进入部署目录）：

```bash
cd /opt/stacks/github-assets
# 查看状态
docker compose ps
# 查看日志
docker compose logs -f github-assets
# 更新版本
git pull --ff-only
docker compose up -d --build
```

> 自动化脚本方式（备选，不想手动执行以上步骤时）

```bash
mkdir -p /opt/stacks
git clone https://github.com/beiwang02/github-assets.git /opt/stacks/github-assets
cd /opt/stacks/github-assets
sudo bash install.sh
```

脚本自动检查并安装 Docker、保留已有 `.env`，然后构建启动服务。两种方式的编排文件位置一致：`/opt/stacks/github-assets/compose.yaml`。

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

默认不需要修改 `.env`。域名反向代理和排错见下方说明；访问名单见「管理员配置」。

### 域名与 HTTPS 反向代理（可选）

架构：浏览器 → Nginx / Caddy（HTTPS）→ 容器 `:8765`。服务不依赖 Node、数据库、Redis、OAuth App 或 systemd；以下 systemd 命令仅用于宿主机 Nginx。

如需域名，在 `.env` 设置 `PUBLIC_BASE_URL=https://img.example.com`。`ENABLE_TOKEN_LOGIN=true` 默认启用经典 Token 登录。不要将用户登录 Token 写入 `.env`、Git 仓库或截图。

Nginx 示例（需要先安装 Nginx 和 Certbot，并将域名解析到服务器）：

```nginx
server {
    listen 80;
    server_name img.example.com;

    location / {
        proxy_pass http://127.0.0.1:8765;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d img.example.com
# 应用 .env 修改（含 PUBLIC_BASE_URL）
docker compose up -d --build --force-recreate
```

只通过本机反代访问时，可设置 `GITHUB_IMAGE_HOST_BIND=127.0.0.1`，避免公网直接访问容器端口。

### 更新与排错

已有安装更新时，不要再次执行 `cp .env.example .env`，以免覆盖配置：

```bash
cd /opt/stacks/github-assets
git pull --ff-only origin main
docker compose up -d --build --force-recreate
# 容器状态与日志
docker compose ps
docker compose logs -f github-assets
# 本机接口检查（未登录响应可用于确认服务可达）
curl http://127.0.0.1:8765/api/auth/me
# 端口占用检查
ss -lntp 'sport = :8765'
```

仅更新文档或安装脚本、未修改镜像内运行文件时，无需重建或重启容器。

## 管理员配置（可选）

管理员配置只用于按需控制网站访问；仓库会按项目规则自动检测，无需额外指定环境变量：

```env
ADMIN_GITHUB_LOGIN=your-github-username
ALLOWED_GITHUB_LOGINS=
```

- `ADMIN_GITHUB_LOGIN`：可选的管理员 GitHub 用户名；不配置不影响普通使用。
- `ALLOWED_GITHUB_LOGINS`：可选的逗号分隔允许名单；留空表示所有登录用户可访问。

## 文件说明

- `server.mjs`：Token 会话、GitHub API 代理和静态服务
- `github.js`：GitHub 仓库读取、图片/JSON/分组操作和原子提交
- `console.js`：控制台页面交互
- `compose.yaml`、`Dockerfile`、`install.sh`：Docker Compose 部署

## 许可证

项目代码采用 [MIT License](LICENSE)。第三方 Floating UI 与 Inter 字体仍适用各自许可，分别见 `vendor/floating-ui/LICENSE` 和 `fonts/OFL.txt`。
