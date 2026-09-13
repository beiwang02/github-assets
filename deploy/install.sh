#!/usr/bin/env bash
set -euo pipefail

# GitHub 图床一键部署脚本：Ubuntu/Debian + Docker Compose
APP_DIR="${APP_DIR:-/opt/stacks/github-assets}"
PORT="${GITHUB_IMAGE_HOST_PORT:-8765}"

if [[ "${EUID}" -ne 0 ]]; then echo "请使用 root 运行此脚本。" >&2; exit 1; fi
apt-get update
apt-get install -y ca-certificates curl git
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose 插件未安装，请安装 docker-compose-plugin 后重试。" >&2
  exit 1
fi
mkdir -p "$APP_DIR"
cp -a ./. "$APP_DIR/"
cd "$APP_DIR"
if [[ ! -f .env ]]; then
  cp .env.example .env
  sed -i "s/^GITHUB_IMAGE_HOST_PORT=.*/GITHUB_IMAGE_HOST_PORT=$PORT/" .env
  echo "已创建 $APP_DIR/.env，使用默认 8765 端口启动服务。需要限制访问时可稍后编辑该文件。"
else
  echo "$APP_DIR/.env 已存在，不覆盖。"
fi
docker compose up -d --build --force-recreate
docker compose ps
