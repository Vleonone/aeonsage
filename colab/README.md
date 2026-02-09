# 🧠 AeonSage Colab 配置指南

## 🎯 概述

本配置为 AeonSage 项目在 Google Colab 环境中的完整部署方案，特别集成了 Ollama 以实现零Token成本的 AI 推理，包含快速启动和完整配置两种方式。

## 🚀 快速开始

### 方法一：使用 Jupyter Notebook (推荐)

1. 在 Colab 中打开 `colab/setup_colab.ipynb`
2. 逐个运行代码单元格
3. 系统会自动完成环境配置

### 方法二：使用快速脚本

```bash
# 在 Colab 单元格中运行
!bash colab/quick_setup.sh
```

## 📋 完整配置步骤

### 1. 系统检查
```python
# 检查系统环境
import os
print(f"GPU 可用: {'是' if 'COLAB_GPU' in os.environ else '否'}")
!node --version
!pnpm --version
```

### 2. 安装依赖
```bash
# 安装 Node.js 22
!curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
!apt-get install -y nodejs

# 安装 pnpm
!npm install -g pnpm@10.23.0
```

### 3. 克隆和构建
```bash
# 克隆仓库
!git clone https://github.com/Vleonone/AeonsagePro.git aeonsage
%cd aeonsage

# 安装依赖并构建
!pnpm install
!pnpm build
```

### 4. 环境配置
```bash
# 创建环境变量文件
cat > .env << EOF
NODE_ENV=development
AEONSAGE_PROFILE=colab
AEONSAGE_GATEWAY_PORT=18789
AEONSAGE_GATEWAY_BIND=0.0.0.0
EOF
```

## 🎮 常用命令

### 启动网关服务
```bash
# 启动开发网关
!pnpm gateway:dev

# 或者使用自定义端口
!pnpm aeonsage gateway run --bind 0.0.0.0 --port 18789
```

### 运行 CLI 命令
```bash
# 查看帮助
!pnpm aeonsage --help

# 检查系统状态
!pnpm aeonsage doctor

# 运行代理
!pnpm aeonsage agent --message "你好，AeonSage!"
```

### 执行测试
```bash
# 运行测试套件
!pnpm test

# 运行特定测试
!pnpm test -- src/commands/agent.test.ts
```

## 🔧 高级配置

### GPU 支持
```python
# 检查并配置 GPU
import os
if 'COLAB_GPU' in os.environ:
    print("✓ GPU 可用")
    # 安装 CUDA 支持（如需要）
    # !apt-get install -y cuda-toolkit
```

### Ollama 集成 (零Token成本)
```python
# Ollama 自动安装并配置在 Colab 中
!ollama --version

# 验证 Ollama 模型可用性
!ollama list

# Ollama 提供使用本地模型的零Token成本 AI 推理
print("💡 Ollama 实现了本地模型的零Token成本 AI 推理")
```

### Google Drive 集成
```python
# 挂载 Google Drive
from google.colab import drive
drive.mount('/content/drive')

# 设置持久化存储
!mkdir -p /content/drive/MyDrive/aeonsage-data
```

### 端口转发
```python
# 设置 ngrok 隧道（用于外部访问网关）
!pip install pyngrok
from pyngrok import ngrok

# 启动隧道
public_url = ngrok.connect(18789)
print(f"网关可通过 {public_url} 访问")
```

## 🛠️ 故障排除

### 常见问题

1. **内存不足**
```bash
# 清理缓存
!rm -rf ~/.pnpm-store
!pnpm store prune
```

2. **构建失败**
```bash
# 清洁重新构建
!pnpm clean:all
!pnpm install
!pnpm build
```

3. **权限问题**
```bash
# 修复权限
!chmod +x colab/quick_setup.sh
```

### 验证安装
```python
def verify_setup():
    checks = [
        ("Node.js", "node --version"),
        ("pnpm", "pnpm --version"),
        ("AeonSage", "pnpm aeonsage --version"),
    ]
    
    for name, cmd in checks:
        result = !{cmd} 2>/dev/null
        print(f"{'✓' if result else '✗'} {name}: {result[0] if result else '未安装'}")

verify_setup()
```

## 📊 性能优化

### 资源监控
```python
# 监控系统资源
import psutil
import time

def monitor_resources():
    print("CPU 使用率:", psutil.cpu_percent())
    print("内存使用:", psutil.virtual_memory().percent, "%")
    print("磁盘使用:", psutil.disk_usage('/').percent, "%")

monitor_resources()
```

### 缓存优化
```bash
# 启用 pnpm 存储优化
!pnpm config set store-dir ~/.pnpm-store
!pnpm config set virtual-store-dir ~/.pnpm-virtual
```

## 🤖 AI 集成示例

### 基础代理调用
```python
# Python 中调用 AeonSage 代理
import subprocess
import json

def run_agent(message):
    result = subprocess.run([
        'pnpm', 'aeonsage', 'agent', 
        '--message', message,
        '--json'
    ], capture_output=True, text=True)
    
    return json.loads(result.stdout)

# 示例使用
response = run_agent("分析当前市场趋势")
print(json.dumps(response, indent=2, ensure_ascii=False))
```

### 批量处理
```python
# 批量处理消息
messages = [
    "总结今天的新闻要点",
    "分析比特币价格走势",
    "生成技术文档大纲"
]

for i, msg in enumerate(messages):
    print(f"处理消息 {i+1}: {msg}")
    result = run_agent(msg)
    print(f"结果: {result.get('response', '无响应')}")
    print("-" * 50)
```

## 📚 参考资源

- [AeonSage 官方文档](https://docs.aeonsage.org/)
- [Node.js 22 安装指南](https://github.com/nodesource/distributions)
- [pnpm 文档](https://pnpm.io/)
- [Google Colab 官方文档](https://colab.research.google.com/)

---
*此配置由 AeonSage CTO 团队维护，确保与最新版本兼容*