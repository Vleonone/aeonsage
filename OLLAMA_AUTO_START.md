# Ollama 自动启动配置

## 📋 概述

此配置允许 AeonsagePro Gateway 启动时自动启动 Ollama 服务，确保 CognitiveRouter 的 Oracle 引擎可以正常工作。

---

## 🚀 使用方法

### 方法 1: 使用 npm 脚本（推荐）

#### Linux/macOS:
```bash
cd AeonsagePro
pnpm gateway:ollama
```

#### Windows:
```bash
cd AeonsagePro
pnpm gateway:ollama:win
```

### 方法 2: 直接运行脚本

#### Linux/macOS:
```bash
cd AeonsagePro
bash scripts/gateway-with-ollama.sh
```

#### Windows:
```cmd
cd AeonsagePro
scripts\gateway-with-ollama.bat
```

---

## 📁 文件说明

### 启动脚本

1. **`scripts/gateway-with-ollama.sh`** (Linux/macOS)
   - 自动检查并启动 Ollama 服务
   - 预加载 qwen2.5:0.5b 模型
   - 启动 AeonsagePro Gateway

2. **`scripts/gateway-with-ollama.bat`** (Windows)
   - Windows 版本的启动脚本
   - 功能与 .sh 版本相同

### 辅助脚本

3. **`scripts/start-ollama-service.sh`** (Linux/macOS)
   - 单独的 Ollama 启动脚本
   - 可以独立使用

4. **`scripts/start-ollama-service.bat`** (Windows)
   - Windows 版本的 Ollama 启动脚本

---

## ⚙️ 工作流程

```
用户运行: pnpm gateway:ollama
         ↓
检查 Ollama 是否已运行
         ↓
    [否] → 启动 Ollama 服务
         ↓
预加载 qwen2.5:0.5b 模型
         ↓
启动 AeonsagePro Gateway
         ↓
Oracle 引擎可以正常工作 ✅
```

---

## 🔧 自定义配置

### 修改 Oracle 超时时间

编辑 `src/cognitive-router/oracle/engine.ts`:

```typescript
const ORACLE_CONFIG = {
    baseUrl: "http://127.0.0.1:11434/v1",
    model: "qwen2.5:0.5b",
    timeoutMs: 1000, // 修改此值（单位：毫秒）
    maxRetries: 1,
};
```

### 使用不同的模型

编辑启动脚本，将 `qwen2.5:0.5b` 替换为其他模型：

```bash
ollama run qwen2.5:1.5b "test"  # 使用更大的模型
```

**注意**: 确保在 `oracle/engine.ts` 中也更新模型名称。

---

## 🧪 验证安装

运行诊断测试：

```bash
cd AeonsagePro
npx tsx src/cognitive-router/test-oracle-debug.ts
```

预期输出：
```
✅ Oracle Response Received!
⏱️  Time: ~500-800ms
📊 Judgment:
   - Complexity: X/10
   - Domain: ...
   - Reasoning Required: ...
   - Suggested Tier: ...
```

---

## 📊 性能优化

### 1. 预加载模型（推荐）

在后台保持模型加载：

```bash
ollama run qwen2.5:0.5b --keepalive 1h "test"
```

### 2. 增加超时时间

如果经常超时，增加 `timeoutMs`:

```typescript
timeoutMs: 1500, // 增加到 1.5 秒
```

### 3. 使用更快的模型

如果 0.5b 模型太慢，尝试：

```bash
ollama pull qwen2.5:0.5b-instruct  # 指令微调版本可能更快
```

---

## ⚠️ 常见问题

### Q: Ollama 启动失败

**A:** 检查 Ollama 是否已安装：

```bash
ollama --version
```

如果未安装，访问：https://ollama.ai/install

### Q: 模型下载失败

**A:** 手动拉取模型：

```bash
ollama pull qwen2.5:0.5b
```

### Q: Oracle 仍然超时

**A:** 按顺序尝试：

1. 增加超时时间到 1500ms
2. 预加载模型（见上）
3. 检查系统资源（CPU/内存）

### Q: Windows 脚本无法运行

**A:** 确保以管理员权限运行，或者直接使用：

```cmd
ollama serve
REM 等待几秒后，在新窗口运行：
cd AeonsagePro
pnpm gateway:dev
```

---

## 🎯 最佳实践

1. **生产环境**: 使用系统服务（systemd/Windows Service）启动 Ollama
2. **开发环境**: 使用 `pnpm gateway:ollama` 自动启动
3. **性能调优**: 始终预加载模型到内存
4. **监控**: 定期检查 Oracle 响应时间

---

## 📈 性能指标

启用 Ollama 后的预期性能：

| 指标 | 无 Ollama | 有 Ollama |
|------|-----------|-----------|
| P50 延迟 | 0.1ms (fallback) | 500-800ms |
| 智能路由 | ❌ | ✅ |
| 成本优化 | 基础 | 43% 免费模型 |
| 准确性 | 默认层级 | 智能分类 |

---

## 🔗 相关文档

- [CognitiveRouter 架构](COGNITIVE_ROUTER_CHECK_REPORT.md)
- [Oracle Engine 设计](src/cognitive-router/oracle/engine.ts)
- [基准测试](src/cognitive-router/benchmark.ts)

---

**最后更新**: 2026-02-08
**维护者**: AeonSage Intelligence Collective
