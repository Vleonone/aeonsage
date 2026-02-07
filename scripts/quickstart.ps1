# ============================================================================
# AeonSage Quickstart Install Script (Windows PowerShell)
# ============================================================================
# 一键安装 AeonSage 的 Windows 脚本
#
# 本地执行: .\scripts\quickstart.ps1
# 网络安装: Invoke-WebRequest https://raw.githubusercontent.com/Vleonone/Aeonsagepro/main/scripts/quickstart.ps1 | Invoke-Expression
# ============================================================================

$ErrorActionPreference = "Stop"

# 颜色函数
function Write-Info { Write-Host "[INFO] $args" -ForegroundColor Blue }
function Write-Success { Write-Host "[✓] $args" -ForegroundColor Green }
function Write-Warn { Write-Host "[!] $args" -ForegroundColor Yellow }
function Write-Error { Write-Host "[✗] $args" -ForegroundColor Red }

# Logo
function Show-Logo {
    Write-Host ""
    Write-Host "  ◈ AeonSage" -ForegroundColor Cyan
    Write-Host "  Personal AI Cognitive OS" -ForegroundColor Cyan
    Write-Host ""
}

# 检查命令是否存在
function Test-Command {
    param([string]$Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# 检查 Node.js 版本
function Test-NodeVersion {
    if (Test-Command "node") {
        $version = (node --version) -replace 'v', '' -split '\.' | Select-Object -First 1
        if ([int]$version -ge 22) {
            Write-Success "Node.js $(node --version) ✓"
            return $true
        }
        else {
            Write-Warn "Node.js 版本过低 (需要 v22+)"
            return $false
        }
    }
    else {
        Write-Warn "未安装 Node.js"
        return $false
    }
}

# 安装 Node.js
function Install-NodeJS {
    Write-Info "正在安装 Node.js 22+..."
    
    # 检查 winget
    if (Test-Command "winget") {
        winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    }
    # 检查 choco
    elseif (Test-Command "choco") {
        choco install nodejs-lts -y
    }
    # 检查 scoop
    elseif (Test-Command "scoop") {
        scoop install nodejs-lts
    }
    else {
        Write-Error "请安装 winget、chocolatey 或 scoop，或手动安装 Node.js 22+"
        Write-Host "下载: https://nodejs.org/"
        exit 1
    }
    
    # 刷新环境变量
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    
    Write-Success "Node.js 安装完成"
}

# 检查/安装 pnpm
function Test-Pnpm {
    if (Test-Command "pnpm") {
        Write-Success "pnpm $(pnpm --version) ✓"
        return $true
    }
    
    Write-Info "正在安装 pnpm..."
    
    # 方法1: 使用 corepack (Node.js 16.10+, 无需管理员权限)
    if (Test-Command "corepack") {
        corepack enable
        corepack prepare pnpm@latest --activate
        Write-Success "pnpm 安装完成 (通过 corepack)"
        return $true
    }
    
    # 方法2: 使用官方安装脚本
    try {
        Invoke-WebRequest https://get.pnpm.io/install.ps1 -useb | Invoke-Expression
        # 刷新环境变量
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        Write-Success "pnpm 安装完成"
        return $true
    }
    catch {
        Write-Error "pnpm 安装失败，请尝试手动安装: https://pnpm.io/installation"
        exit 1
    }
}

# 主安装流程
function Main {
    Show-Logo
    Write-Info "开始安装 AeonSage..."
    Write-Host ""

    # Step 1: 检查/安装 Node.js
    Write-Info "[1/4] 检查 Node.js..."
    if (-not (Test-NodeVersion)) {
        Install-NodeJS
    }

    # Step 2: 检查/安装 pnpm
    Write-Info "[2/4] 检查 pnpm..."
    Test-Pnpm | Out-Null

    # Step 3: 安装 AeonSage
    Write-Info "[3/4] 安装 AeonSage..."
    # 检查是否已发布
    $packageExists = pnpm view aeonsage version 2>$null
    if ($packageExists) {
        pnpm add -g aeonsage@latest
        Write-Success "AeonSage 安装完成"
    }
    else {
        Write-Warn "包 'aeonsage' 尚未在 npm 发布。跳过全局安装 (创世阶段)。"
        Write-Info "您可以手动构建并运行: pnpm build && pnpm start"
    }

    # Step 4: 运行 onboard
    Write-Info "[4/4] 启动配置向导..."
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    if (Test-Command "aeonsage") {
        aeonsage onboard --install-daemon
    }
    else {
        Write-Warn "未检测到 'aeonsage' 命令，跳过向导。"
        Write-Info "待包发布后或手动安装后，运行 'aeonsage onboard' 进行配置。"
    }

    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Success "AeonSage 安装完成!"
    Write-Host ""
    Write-Host "快速命令:"
    Write-Host "  aeonsage gateway        # 启动 Gateway"
    Write-Host "  aeonsage doctor         # 诊断问题"
    Write-Host "  aeonsage channels login # 添加通道"
    Write-Host ""
    Write-Host "文档: https://docs.aeonsage.org"
    Write-Host ""
}

# 运行
try {
    Main
}
catch {
    Write-Error "安装失败: $_"
    exit 1
}
