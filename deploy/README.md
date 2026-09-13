# VPS 部署说明

这个项目使用 Node.js 内置 HTTP 服务，不需要 npm 依赖。生产环境建议：Node 只监听 `127.0.0.1:8080`，由 Nginx 提供 HTTPS 和反向代理。

## 1. 上传并解压

```bash
sudo mkdir -p /opt/github-image-host
sudo tar -xzf github-image-host-web.tar.gz -C /opt/github-image-host --strip-components=1
sudo useradd --system --home /opt/github-image-host --shell /usr/sbin/nologin github-image-host 2>/dev/null || true
sudo chown -R github-image-host:github-image-host /opt/github-image-host
```

## 2. 配置环境变量

把 `your-domain.example` 换成你的真实域名；OAuth Secret 只写在 VPS 环境变量里，不要写入前端文件或 Git 仓库。

```bash
sudo install -m 600 /dev/null /etc/github-image-host.env
sudo nano /etc/github-image-host.env
```

内容：

```env
NODE_ENV=production
HOST=127.0.0.1
PORT=8080
PUBLIC_BASE_URL=https://your-domain.example
GITHUB_CLIENT_ID=你的OAuth_Client_ID
GITHUB_CLIENT_SECRET=你的OAuth_Client_Secret
GITHUB_OAUTH_SCOPE=public_repo
ENABLE_REPO_DELETE=false
```

## 3. 创建 systemd 服务

```bash
sudo cp deploy/github-image-host.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now github-image-host
sudo systemctl status github-image-host
```

查看日志：

```bash
sudo journalctl -u github-image-host -f
```

## 4. 配置 Nginx

先把域名 DNS 的 A 记录指向 VPS，然后：

```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
sudo cp deploy/nginx.conf.example /etc/nginx/sites-available/github-image-host
sudo nano /etc/nginx/sites-available/github-image-host
sudo ln -s /etc/nginx/sites-available/github-image-host /etc/nginx/sites-enabled/github-image-host
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.example
```

防火墙只开放 80 和 443，不要把 8080 暴露到公网：

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## 5. 创建 GitHub OAuth App

Homepage URL：

```text
https://your-domain.example
```

Authorization callback URL：

```text
https://your-domain.example/api/auth/github/callback
```

启动服务后访问：

```text
https://your-domain.example
```

点击「GitHub 登录」，授权后在仓库设置里填写你原脚本使用的仓库，例如：

```text
仓库用户名：beiwang02
仓库名称：beiwang-assets
分支名称：main
图片目录：assets
```

## 更新网站

在本地生成新的源码包后上传：

```bash
scp github-image-host-web.tar.gz root@your-domain.example:/tmp/
sudo rm -rf /opt/github-image-host/*
sudo tar -xzf /tmp/github-image-host-web.tar.gz -C /opt/github-image-host --strip-components=1
sudo chown -R github-image-host:github-image-host /opt/github-image-host
sudo systemctl restart github-image-host
```

GitHub 仓库里的图片和 JSON 不会因为更新网站源码而改变。只有在网站中实际执行上传、删除、改名或 JSON 修改操作时，才会产生 GitHub 提交。

## 注意

当前服务的 OAuth 会话保存在 Node 进程内存中，重启后需要重新登录。单 VPS 单进程测试没有问题；以后扩展多实例时再换 Redis 或数据库会话。
