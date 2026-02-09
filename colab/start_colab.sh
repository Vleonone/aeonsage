#!/bin/bash
# AeonSage Colab 启动脚本
# 用于在 Colab 环境中快速启动 AeonSage 服务

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查先决条件
check_prerequisites() {
    log_info "检查先决条件..."
    
    # 检查是否在 Colab 环境中
    if [ ! -d "/content" ]; then
        log_warning "似乎不在 Colab 环境中运行"
    fi
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先运行安装脚本"
        exit 1
    fi
    
    # 检查 pnpm
    if ! command -v pnpm &> /dev/null; then
        log_error "pnpm 未安装，请先运行安装脚本"
        exit 1
    fi
    
    log_success "先决条件检查通过"
}

# 设置工作目录
setup_working_directory() {
    log_info "设置工作目录..."
    
    if [ ! -d "aeonsage" ]; then
        log_error "AeonSage 项目目录不存在，请先运行安装脚本"
        exit 1
    fi
    
    cd aeonsage
    log_success "工作目录设置完成: $(pwd)"
}

# 配置环境变量
configure_environment() {
    log_info "配置环境变量..."
    
    # 创建或更新 .env 文件
    cat > .env << EOF
# AeonSage Colab 配置
NODE_ENV=development
AEONSAGE_PROFILE=colab
AEONSAGE_GATEWAY_PORT=${PORT:-18789}
AEONSAGE_GATEWAY_BIND=0.0.0.0
AEONSAGE_LOG_LEVEL=info

# 可选配置
# ANTHROPIC_API_KEY=your_key_here
# OPENAI_API_KEY=your_key_here
# DISCORD_BOT_TOKEN=your_token_here
EOF
    
    log_success "环境变量配置完成"
}

# 检查并安装依赖
install_dependencies() {
    log_info "检查依赖..."
    
    if [ ! -d "node_modules" ]; then
        log_warning "依赖未安装，正在安装..."
        pnpm install
        log_success "依赖安装完成"
    else
        log_success "依赖已安装"
    fi
}

# 构建项目
build_project() {
    log_info "检查构建状态..."
    
    if [ ! -d "dist" ]; then
        log_warning "项目未构建，正在构建..."
        pnpm build
        log_success "项目构建完成"
    else
        log_success "项目已构建"
    fi
}

# 启动服务
start_service() {
    local port=${PORT:-18789}
    local bind=${BIND:-0.0.0.0}
    
    log_info "启动 AeonSage 网关服务..."
    log_info "绑定地址: ${bind}"
    log_info "端口: ${port}"
    
    # 检查端口是否被占用
    if lsof -Pi :${port} -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "端口 ${port} 已被占用，尝试终止现有进程..."
        lsof -ti :${port} | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # 启动服务
    echo ""
    echo "🚀 AeonSage 网关正在启动..."
    echo "🌐 访问地址: http://${bind}:${port}"
    echo "📝 日志级别: info"
    echo "⚡ 按 Ctrl+C 停止服务"
    echo ""
    
    # 使用 nohup 在后台运行
    nohup pnpm aeonsage gateway run --bind ${bind} --port ${port} > /tmp/aeonsage-gateway.log 2>&1 &
    local pid=$!
    
    # 等待服务启动
    sleep 5
    
    # 检查服务状态
    if kill -0 $pid 2>/dev/null; then
        log_success "服务启动成功 (PID: $pid)"
        echo "📝 日志文件: /tmp/aeonsage-gateway.log"
        echo "📊 查看日志: tail -f /tmp/aeonsage-gateway.log"
        echo "🛑 停止服务: kill $pid"
    else
        log_error "服务启动失败"
        echo "查看错误日志:"
        tail -20 /tmp/aeonsage-gateway.log
        exit 1
    fi
}

# 设置端口转发 (适用于 Colab)
setup_port_forwarding() {
    local port=${PORT:-18789}
    log_info "设置端口转发..."
    
    # 检查是否在 Colab 环境中
    if python3 -c "import google.colab" 2>/dev/null; then
        log_info "检测到 Colab 环境"
        
        # 方法1: ngrok 隧道 (推荐 — 支持远程 TUI 连接)
        log_info "设置 ngrok 隧道以支持远程 TUI 连接..."
        python3 <<EOF
import subprocess, sys

# 安装 pyngrok
subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-q', 'pyngrok'])

from pyngrok import ngrok
import os

# 如果设置了 NGROK_AUTH_TOKEN 则认证
auth_token = os.environ.get('NGROK_AUTH_TOKEN', '')
if auth_token:
    ngrok.set_auth_token(auth_token)

try:
    public_url = ngrok.connect(${port}, "http")
    print(f"")
    print(f"🌐 ════════════════════════════════════════════════")
    print(f"🌐  AeonSage Gateway 已暴露到公网")
    print(f"🌐  公网地址: {public_url}")
    print(f"🌐 ════════════════════════════════════════════════")
    print(f"")
    print(f"📋 在本地 TUI 中连接:")
    print(f"   AEONSAGE_GATEWAY_URL={public_url} aeonsage")
    print(f"")
except Exception as e:
    print(f"⚠️  ngrok 隧道创建失败: {e}")
    print(f"💡 提示: 设置 NGROK_AUTH_TOKEN 环境变量可获得更稳定的隧道")
    
    # 回退到 Colab 端口转发
    try:
        from google.colab import output
        output.serve_kernel_port_as_window(${port}, path='/')
        print("✅ 已回退到 Colab 内置端口转发 (仅限浏览器访问)")
    except Exception as e2:
        print(f"⚠️  端口转发设置失败: {e2}")
EOF
    else
        log_info "非 Colab 环境，跳过端口转发设置"
        log_info "Gateway 可通过 http://localhost:${port} 直接访问"
    fi
}

# 主函数
main() {
    echo "🤖 AeonSage Colab 启动器"
    echo "=========================="
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            --port|-p)
                PORT="$2"
                shift 2
                ;;
            --bind|-b)
                BIND="$2"
                shift 2
                ;;
            --help|-h)
                echo "用法: $0 [选项]"
                echo "选项:"
                echo "  -p, --port PORT    指定端口 (默认: 18789)"
                echo "  -b, --bind ADDR    指定绑定地址 (默认: 0.0.0.0)"
                echo "  -h, --help         显示此帮助信息"
                exit 0
                ;;
            *)
                log_error "未知选项: $1"
                exit 1
                ;;
        esac
    done
    
    # 执行设置步骤
    check_prerequisites
    setup_working_directory
    configure_environment
    install_dependencies
    build_project
    start_service
    setup_port_forwarding
    
    log_success "AeonSage Colab 环境启动完成！"
    echo ""
    echo "💡 下一步操作:"
    echo "1. 访问网关界面: http://localhost:${PORT:-18789}"
    echo "2. 查看日志: tail -f /tmp/aeonsage-gateway.log"
    echo "3. 运行 CLI: pnpm aeonsage --help"
    echo "4. 停止服务: kill $(cat /tmp/aeonsage-gateway.pid 2>/dev/null || echo '进程ID')"
}

# 运行主函数
main "$@"