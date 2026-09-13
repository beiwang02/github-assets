#!/usr/bin/env bash
set -euo pipefail

# 一键部署：在项目目录执行；脚本会安装 Docker（若未安装），创建 .env，并启动服务。
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
bash deploy/install.sh
