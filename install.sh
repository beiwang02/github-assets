#!/usr/bin/env bash
set -euo pipefail

# GitHub 图床一键部署脚本：Ubuntu/Debian + Docker Compose
# 从任意工作目录调用时，始终复制本脚本所在的项目根目录。
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)"
cd "$SCRIPT_DIR"
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
if [[ "$(pwd -P)" != "$(cd "$APP_DIR" && pwd -P)" ]]; then
  shopt -s dotglob nullglob
  for source in "$SCRIPT_DIR"/*; do
    # 不让源码目录中的 .env 覆盖部署目录已有的配置。
    if [[ "${source##*/}" == .env && -f "$APP_DIR/.env" ]]; then continue; fi
    cp -a "$source" "$APP_DIR/"
  done
  shopt -u dotglob nullglob
fi
cd "$APP_DIR"
if [[ ! -f .env ]]; then
  cp .env.example .env
  sed -i "s/^GITHUB_IMAGE_HOST_PORT=.*/GITHUB_IMAGE_HOST_PORT=$PORT/" .env
  echo "已创建 $APP_DIR/.env，使用 $PORT 端口启动服务。需要限制访问时可稍后编辑该文件。"
else
  echo "$APP_DIR/.env 已存在，不覆盖。"
fi
docker compose up -d --build --force-recreate
docker compose ps
