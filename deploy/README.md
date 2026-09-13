# 高级部署说明

根目录 `README.md` 提供一键安装和标准 Docker Compose 部署。本文件只说明域名反向代理、更新和排错。

## 当前架构

```text
浏览器 → Nginx / Caddy（可选，HTTPS）→ github-assets 容器 :8765
```

服务内外统一使用 `8765`。容器本身不依赖 Node、数据库、Redis、OAuth App 或 systemd。

## 环境变量

复制示例配置：

```bash
cp .env.example .env
```

默认配置已可直接启动。常用可选项：

```env
# 对外地址；部署 HTTPS 域名时改成实际域名
PUBLIC_BASE_URL=https://img.example.com

# 管理员访问控制（可选）
ADMIN_GITHUB_LOGIN=你的GitHub用户名
ALLOWED_GITHUB_LOGINS=

# 仅管理员登录后自动恢复的默认仓库（可选）
# ADMIN_RESTORE_REPO=你的旧图床仓库名

# 默认启用经典 Token 登录
ENABLE_TOKEN_LOGIN=true
```

不要将用户登录 Token 写入 `.env`、Git 仓库或截图。

## Nginx HTTPS 反向代理（可选）

如果使用域名，建议让 Nginx 处理 HTTPS，服务仍保持 `8765`：

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

验证并申请证书：

```bash
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d img.example.com
```

然后把 `.env` 的 `PUBLIC_BASE_URL` 改为：

```env
PUBLIC_BASE_URL=https://img.example.com
```

重新构建：

```bash
docker compose up -d --build --force-recreate
```

## 更新

```bash
cd /opt/stacks/github-assets
git pull origin main
docker compose up -d --build --force-recreate
```

## 排错

```bash
# 容器状态
docker compose ps

# 实时日志
docker compose logs -f github-assets

# 本机接口检查
curl http://127.0.0.1:8765/api/auth/me
```

若端口被占用，检查：

```bash
ss -lntp | grep 8765
```
