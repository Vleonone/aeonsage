#!/usr/bin/env bash
# ============================================================================
# AeonSage Quickstart Install Script (macOS / Linux)
# ============================================================================
# 一键安装 AeonSage 的最简脚本
#
# 本地执行: ./scripts/quickstart.sh
# 网络安装: curl -fsSL https://raw.githubusercontent.com/Vleonone/Aeonsagepro/main/scripts/quickstart.sh | bash
# ============================================================================

set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logo
print_logo() {
  echo -e "${CYAN}"
  echo "  ◈ AeonSage"
  echo "  Personal AI Cognitive OS"
  echo -e "${NC}"
}

# 日志函数
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[✓]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[!]${NC} $1"; }
log_error() { echo -e "${RED}[✗]${NC} $1"; }

# 检查命令是否存在
check_cmd() {
  command -v "$1" >/dev/null 2>&1
}

# 检查 Node.js 版本
check_node() {
  if check_cmd node; then
    local version=$(node --version | sed 's/v//' | cut -d. -f1)
    if [ "$version" -ge 22 ]; then
      log_success "Node.js v$(node --version) ✓"
      return 0
    else
      log_warn "Node.js 版本过低 (需要 v22+)"
      return 1
    fi
  else
    log_warn "未安装 Node.js"
    return 1
  fi
}

# 安装 Node.js
install_node() {
  log_info "正在安装 Node.js 22+..."
  
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if check_cmd brew; then
      brew install node@22
      brew link node@22 --force --overwrite
    else
      log_error "请先安装 Homebrew: https://brew.sh"
      exit 1
    fi
  else
    # Linux
    if check_cmd apt-get; then
      curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
      sudo apt-get install -y nodejs
    elif check_cmd dnf; then
      curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
      sudo dnf install -y nodejs
    else
      log_error "不支持的包管理器，请手动安装 Node.js 22+"
      exit 1
    fi
  fi
  
  log_success "Node.js 安装完成"
}

# 检查/安装 pnpm
check_pnpm() {
  if check_cmd pnpm; then
    log_success "pnpm $(pnpm --version) ✓"
    return 0
  else
    log_info "正在启用 pnpm (via corepack)..."
    # 使用 corepack 避免权限问题
    if check_cmd corepack; then
      corepack enable pnpm 2>/dev/null || sudo corepack enable pnpm
    else
      # fallback: 使用 sudo 安装
      sudo npm install -g pnpm
    fi
    log_success "pnpm 安装完成"
    return 0
  fi
}

# 主安装流程
main() {
  print_logo
  echo ""
  log_info "开始安装 AeonSage..."
  echo ""

  # Step 1: 检查/安装 Node.js
  log_info "[1/4] 检查 Node.js..."
  if ! check_node; then
    install_node
  fi

  # Step 2: 检查/安装 pnpm
  log_info "[2/4] 检查 pnpm..."
  check_pnpm

  # Step 3: 安装 AeonSage
  log_info "[3/4] 安装 AeonSage..."
  if npm view aeonsage version >/dev/null 2>&1; then
    pnpm add -g aeonsage@latest
    log_success "AeonSage 安装完成"
  else
    log_warn "包 'aeonsage' 尚未在 npm 发布。跳过全局安装 (创世阶段)。"
    log_info "您可以手动构建并运行: pnpm build && pnpm start"
  fi

  # Step 4: 运行 onboard
  log_info "[4/4] 启动配置向导..."
  echo ""
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  
  if check_cmd aeonsage; then
    aeonsage onboard --install-daemon
  else
    log_warn "未检测到 'aeonsage' 命令，跳过向导。"
    log_info "待包发布后或手动安装后，运行 'aeonsage onboard' 进行配置。"
  fi

  echo ""
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  log_success "AeonSage 安装完成!"
  echo ""
  echo "快速命令:"
  echo "  aeonsage gateway        # 启动 Gateway"
  echo "  aeonsage doctor         # 诊断问题"
  echo "  aeonsage channels login # 添加通道"
  echo ""
  echo ""
}

# 错误处理
trap 'log_error "安装中断"; exit 1' INT TERM

# 运行
main "$@"
