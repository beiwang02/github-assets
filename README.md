# GitHub 图床 Web 控制台

一个不保存用户图片和 JSON 的 GitHub 图床管理工具。用户通过 GitHub OAuth 登录，图片和 JSON 始终保存在用户自己的 GitHub 仓库中。OAuth 访问令牌只保存在 Node 进程内存会话中，不写入前端、本地文件或数据库。

## 功能

- GitHub OAuth 登录，Token 只保存在服务端内存会话
- 可选的 Token 临时登录模式（默认关闭）
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

## 本地运行

```bash
node server.mjs
```

打开 `http://127.0.0.1:8080`。Node 18+ 可用，不需要 npm 依赖。

## Docker Compose

```bash
cp .env.example .env
# 按需修改 .env
./install.sh
```

默认容器端口为 8080。直接 IP 测试可以在 `.env` 中设置：

```env
HOST=0.0.0.0
PORT=8080
GITHUB_IMAGE_HOST_BIND=0.0.0.0
GITHUB_IMAGE_HOST_PORT=8765
PUBLIC_BASE_URL=http://your-server-ip:8765
```

## 管理员配置

管理员登录名和访问名单由环境变量提供，网页后台可以修改允许策略；策略保存在独立 Docker volume，不保存用户业务内容。

```env
ADMIN_GITHUB_LOGIN=你的 GitHub 用户名
ADMIN_RESTORE_REPO=你的旧图床仓库名
ALLOWED_GITHUB_LOGINS=
```

- `ADMIN_GITHUB_LOGIN`：管理员 GitHub 用户名
- `ADMIN_RESTORE_REPO`：管理员登录后直接恢复的旧仓库名称，可留空
- `ALLOWED_GITHUB_LOGINS`：逗号分隔的允许名单；留空表示所有登录用户允许访问

普通用户不使用管理员的旧仓库。没有自己的图床仓库时，可以在网站内创建公开仓库；已有同结构仓库时，网站只在结构匹配明确时恢复，否则由用户自己选择或创建。

## 数据和安全

服务端不保存图片、JSON、仓库快照或 Token 到数据库和文件。Token 只存在 Node 进程内存会话中；“记住此设备”只保存到用户自己的浏览器本地。公网使用请启用 HTTPS，HTTP 不适合输入 Token。

## 文件

- `server.mjs`：Token 会话、GitHub API 安全代理和静态服务
- `github.js`：仓库读取、图片/JSON/分组操作和原子提交
- `console.js`：控制台页面和交互
- `index.html`、`styles.css`、`console.css`：页面和样式
- `compose.yaml`、`Dockerfile`、`install.sh`：部署文件
- `deploy/README.md`：VPS 部署说明
