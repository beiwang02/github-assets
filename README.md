# GitHub 图床 Web 控制台

一个不保存用户图片和 JSON 的 GitHub 图床管理工具。用户使用 GitHub 经典 Token 登录，图片和 JSON 始终保存在用户自己的 GitHub 仓库中。Token 只保存在 Node 进程内存会话中，不写入数据库。

## 功能

- GitHub 经典 Token 登录，支持记住此设备
- Token 只保存在服务端内存会话和用户可选的本地记忆中
- 管理员恢复指定旧仓库
- 普通用户创建自己的公开图床仓库
- 兼容 `assets/`、`icons/` 图片目录
- JSON 库读取、创建、编辑、改名、删除
- 图片上传、预览、直链复制、改名、删除
- 图片分组创建、改名、删除
- 改名和删除时同步更新 JSON 引用
- 多选图片、批量加入 JSON、批量删除
- GitHub SHA 冲突保护和原子 Git 提交
- 管理员网页访问策略：允许所有人或仅允许名单
- 深色、浅色、跟随系统三种外观
- 响应式移动端界面

## 部署

服务内外统一使用 `8765` 端口；部署完成后访问：

```text
http://服务器IP:8765
```

### 一键安装（推荐）

在 Ubuntu / Debian 服务器执行下面命令，直接从本仓库拉取源码并运行 Docker Compose 编排：

```bash
git clone https://github.com/beiwang02/github-assets.git
cd github-assets
chmod +x install.sh
sudo ./install.sh
```

脚本会自动安装 Docker（如未安装）、复制项目至 `/opt/stacks/github-assets`，并构建、启动服务。

### Compose 编排内容

仓库根目录的 [`compose.yaml`](compose.yaml) 就是部署编排文件，包含一个 `github-assets` 服务和用于保存访问策略的 Docker volume：

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

- `github-assets`：图床控制台服务；容器异常退出后自动重启。
- `8765:8765`：服务器和容器都使用 `8765`。
- `access-policy`：只保存管理员访问策略，不保存图片、JSON 或登录 Token。
- `read_only`：容器根文件系统只读，降低运行风险。

### 手动 Docker Compose 部署

适合需要自行管理源码或升级流程的用户：

```bash
git clone https://github.com/beiwang02/github-assets.git
cd github-assets
cp .env.example .env
docker compose up -d --build
```

查看运行状态与日志：

```bash
docker compose ps
docker compose logs -f github-assets
```

更新到最新版本：

```bash
git pull origin main
docker compose up -d --build --force-recreate
```

默认端口已是 `8765`，通常不需要编辑 `.env`。需要自定义域名、访问限制或其他高级配置时，查看 [`deploy/README.md`](deploy/README.md)。

## 管理员配置
普通用户登录后可以选择自己的仓库或创建新仓库，不需要填写任何“旧仓库”。策略保存在独立 Docker volume，不保存用户业务内容。

```env
# 只有需要限制访问或使用管理后台时才填写
ADMIN_GITHUB_LOGIN=你的 GitHub 用户名
ALLOWED_GITHUB_LOGINS=

# 可选：管理员登录后自动恢复的旧图床仓库名；不使用就留空或删除这一行
# ADMIN_RESTORE_REPO=你的旧图床仓库名
```

- `ADMIN_GITHUB_LOGIN`：可选，管理员 GitHub 用户名
- `ADMIN_RESTORE_REPO`：可选，仅用于管理员登录后自动恢复指定旧仓库，不是项目必须项
- `ALLOWED_GITHUB_LOGINS`：可选，逗号分隔的允许名单；留空表示所有已授权用户允许访问

项目不会固定使用任何仓库名称，也不会要求普通用户使用管理员的旧仓库。网站会按仓库结构自动识别，无法确定时由用户选择或创建。

## 数据和安全

服务端不保存图片、JSON、仓库快照或 Token 到数据库和文件。Token 只存在 Node 进程内存会话中；“记住此设备”只保存到用户自己的浏览器本地。公网使用请启用 HTTPS，HTTP 不适合输入 Token。

## 文件

- `server.mjs`：Token 会话、GitHub API 安全代理和静态服务
- `github.js`：仓库读取、图片/JSON/分组操作和原子提交
- `console.js`：控制台页面和交互
- `index.html`、`styles.css`、`console.css`：页面和样式
- `compose.yaml`、`Dockerfile`、`install.sh`：部署文件
- `deploy/README.md`：VPS 部署说明
