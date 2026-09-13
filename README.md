# GitHub 图床 Web 控制台

GitHub 图片资源、分组、JSON 库和 Raw 直链管理工具。用户使用自己的 GitHub Personal Access Token 登录；图片和 JSON 始终保存在用户自己的 GitHub 仓库。

## 功能

- Token 登录与记住此设备
- 管理员恢复指定旧仓库
- 普通用户创建自己的公开图床仓库
- JSON 库、图片、分组和 Raw 直链管理
- 图片改名/删除时同步 JSON 引用
- 批量加入 JSON、批量删除
- 管理员访问策略：允许所有人或仅允许名单
- 跟随系统、黑夜、白天三种外观
- Docker Compose 一键部署

## 快速部署

```bash
cp .env.example .env
./install.sh
```

## Token 权限

仅支持公开仓库图床：Classic Token 勾选 `public_repo`；Fine-grained Token 对目标公开仓库开启 `Contents: Read and write` 和 `Metadata: Read-only`。

## 数据

服务端不保存图片、JSON、仓库快照或 Token 到文件和数据库。Token 只存在内存会话；记住此设备仅保存到用户自己的浏览器本地。

详见仓库内 README、Docker Compose 和 install.sh。
