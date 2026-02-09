# 🔧 AeonSage 配置完全指南

## 📋 配置文件说明

AeonSage Gateway 使用以下配置文件（按优先级）：

1. **config.local.json** - 本地配置（优先级最高，不提交到 Git）
2. **config.json** - 生产配置
3. **config.example.json** - 配置模板

推荐工作流程：
```bash
# 1. 复制配置模板
cp config.example.json config.local.json

# 2. 编辑配置文件
vim config.local.json

# 3. 启动 Gateway
pnpm gateway:dev
```

---

## 🎯 快速开始配置

### 最小配置（仅 Ollama）

```json
{
  "gateway": {
    "port": 18789,
    "bind": "0.0.0.0"
  },
  "models": {
    "providers": {
      "ollama": {
        "apiKey": "ollama",
        "baseUrl": "http://127.0.0.1:11434/v1"
      }
    }
  }
}
```

### 推荐配置（智能路由）

```json
{
  "gateway": {
    "port": 18789,
    "bind": "0.0.0.0",
    "auth": {
      "mode": "token",
      "token": "your-secure-token-here"
    }
  },
  "models": {
    "providers": {
      "ollama": {
        "apiKey": "ollama",
        "baseUrl": "http://127.0.0.1:11434/v1",
        "enabled": true
      },
      "openai": {
        "apiKey": "sk-proj-xxxxx",
        "enabled": true
      },
      "anthropic": {
        "apiKey": "sk-ant-xxxxx",
        "enabled": true
      }
    }
  },
  "cognitive": {
    "enabled": true,
    "oracle": {
      "enabled": true,
      "provider": "ollama",
      "model": "qwen2.5:0.5b",
      "timeout": 1000
    }
  }
}
```

---

## 🌐 Gateway 配置

### 基础设置

```json
{
  "gateway": {
    "port": 18789,           // Gateway 监听端口
    "mode": "local",         // 运行模式: local | cloud
    "bind": "0.0.0.0",       // 绑定地址: 0.0.0.0 (所有) | 127.0.0.1 (本地)
    "auth": {
      "mode": "token",       // 认证模式: token | none
      "token": "secret"      // 访问 token
    }
  }
}
```

### 绑定模式说明

| 模式 | 地址 | 说明 | 适用场景 |
|------|------|------|----------|
| **loopback** | 127.0.0.1 | 仅本机访问 | 本地开发 |
| **lan** | 0.0.0.0 | 局域网访问 | 内网部署 |
| **auto** | 自动检测 | 自动选择 | 通用 |

### VPS 部署推荐

```json
{
  "gateway": {
    "port": 18789,
    "bind": "0.0.0.0",        // 允许外部访问
    "auth": {
      "mode": "token",
      "token": "strong-random-token-here"  // 强密码
    }
  }
}
```

---

## 🤖 模型配置

### Ollama（本地免费）

```json
{
  "models": {
    "providers": {
      "ollama": {
        "apiKey": "ollama",
        "baseUrl": "http://127.0.0.1:11434/v1",
        "enabled": true,
        "models": {
          "qwen2.5:0.5b": {
            "alias": "qwen-mini",
            "contextWindow": 32768
          },
          "llama3.3:70b": {
            "alias": "llama-large",
            "contextWindow": 131072
          }
        }
      }
    }
  }
}
```

### OpenAI

```json
{
  "models": {
    "providers": {
      "openai": {
        "apiKey": "sk-proj-your-key",
        "baseUrl": "https://api.openai.com/v1",
        "enabled": true,
        "organization": "",     // 可选
        "defaultModel": "gpt-4o-mini"
      }
    }
  }
}
```

### Anthropic Claude

```json
{
  "models": {
    "providers": {
      "anthropic": {
        "apiKey": "sk-ant-your-key",
        "baseUrl": "https://api.anthropic.com",
        "enabled": true,
        "defaultModel": "claude-3-5-sonnet-20240620"
      }
    }
  }
}
```

### Kimi

```json
{
  "models": {
    "providers": {
      "kimi": {
        "apiKey": "your-kimi-key",
        "baseUrl": "https://api.moonshot.cn/v1",
        "enabled": true,
        "defaultModel": "moonshot-v1-8k"
      }
    }
  }
}
```

---

## 🧠 CognitiveRouter 配置

### 启用智能路由

```json
{
  "cognitive": {
    "enabled": true,
    "oracle": {
      "enabled": true,
      "provider": "ollama",
      "model": "qwen2.5:0.5b",
      "timeout": 1000          // 毫秒，建议 1000+
    },
    "routing": {
      "enabled": true,
      "tiers": {
        "reflex": {
          "models": [
            "ollama:qwen2.5:0.5b",
            "openrouter:groq/llama-3-8b-8192"
          ],
          "maxComplexity": 3
        },
        "standard": {
          "models": [
            "nvidia:kimi-k2.5",
            "gpt-4o-mini"
          ],
          "maxComplexity": 7
        },
        "deep": {
          "models": [
            "claude-3-5-sonnet-20240620",
            "gpt-4o"
          ],
          "maxComplexity": 10
        }
      },
      "fallbackModel": "gpt-4o-mini"
    }
  }
}
```

### Oracle 配置说明

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| **provider** | 使用的提供商 | ollama |
| **model** | 分类模型 | qwen2.5:0.5b |
| **timeout** | 超时时间（ms） | 1000 |

**重要**：timeout 建议设置为 1000ms 以上，避免 Ollama 冷启动超时。

### 路由层级说明

| 层级 | 用途 | 复杂度 | 模型示例 |
|------|------|--------|----------|
| **Reflex** | 简单任务 | 1-3 | qwen2.5:0.5b |
| **Standard** | 一般任务 | 4-7 | gpt-4o-mini |
| **Deep** | 复杂任务 | 8-10 | claude-sonnet |

---

## 📱 Channel 配置

### Telegram Bot

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "configWrites": true,
      "dmPolicy": "open",          // open | allowlist
      "allowFrom": ["*"],          // 允许的用户 ID 列表
      "groupPolicy": "allowlist",  // open | allowlist
      "streamMode": "partial",     // partial | full | none
      "reactionLevel": "extensive",
      "accounts": {
        "default": {
          "enabled": true,
          "botToken": "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
          "dmPolicy": "open",
          "allowFrom": ["*"]
        }
      }
    }
  }
}
```

### Discord Bot

```json
{
  "channels": {
    "discord": {
      "enabled": true,
      "token": "MTxxxxxxxxxxxxxx.xxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxx",
      "applicationId": "1234567890123456789",
      "prefix": "!ai",
      "mentionRequired": true,
      "allowedChannels": [
        "channel-id-1",
        "channel-id-2"
      ],
      "allowedRoles": ["Developer", "Admin"],
      "useThreads": true,
      "threadAutoArchiveDuration": 60
    }
  }
}
```

### Slack Bot

```json
{
  "channels": {
    "slack": {
      "enabled": true,
      "token": "xoxb-your-slack-bot-token",
      "appToken": "xapp-your-slack-app-token",
      "signingSecret": "your-signing-secret"
    }
  }
}
```

---

## 🎛️ Agent 配置

```json
{
  "agents": {
    "defaults": {
      "model": {
        "primary": "ollama/qwen2.5:0.5b"
      },
      "maxConcurrent": 4,       // 最大并发 Agent 数
      "timeout": 300000,         // 超时时间（ms）
      "subagents": {
        "maxConcurrent": 8,     // 最大并发子 Agent 数
        "timeout": 120000
      }
    }
  }
}
```

---

## 💾 会话配置

```json
{
  "session": {
    "crossChannelMemory": true,    // 跨 Channel 记忆
    "maxHistoryLength": 50,        // 最大历史长度
    "persistToDisk": true,         // 持久化到磁盘
    "expirationHours": 24          // 会话过期时间
  }
}
```

---

## 🔒 安全最佳实践

### 1. 使用 config.local.json

```bash
# 创建本地配置（不提交到 Git）
cp config.example.json config.local.json

# .gitignore 已包含：
# config.local.json
# .env
```

### 2. 强密码 Token

```json
{
  "gateway": {
    "auth": {
      "token": "use-long-random-string-here"
    }
  }
}
```

生成强密码：
```bash
# Linux/macOS
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. 限制访问

仅本地访问：
```json
{
  "gateway": {
    "bind": "127.0.0.1"
  }
}
```

仅特定用户（Telegram）：
```json
{
  "channels": {
    "telegram": {
      "dmPolicy": "allowlist",
      "allowFrom": ["user-id-1", "user-id-2"]
    }
  }
}
```

---

## 📊 配置验证

### 验证 JSON 格式

```bash
# 使用 jq 验证
cat config.local.json | jq .

# 或使用 Node.js
node -e "console.log(JSON.parse(require('fs').readFileSync('config.local.json')))"
```

### 测试配置

```bash
# 启动 Gateway（开发模式）
pnpm gateway:dev

# 检查配置加载日志
# 应显示：
# ✓ Config loaded: config.local.json
# ✓ Ollama provider enabled
# ✓ CognitiveRouter enabled
```

---

## 🐛 常见问题

### Q1: Gateway 无法启动？

检查配置文件 JSON 格式：
```bash
cat config.local.json | jq .
```

### Q2: Ollama 连接失败？

检查 Ollama 服务：
```bash
ollama list
curl http://localhost:11434/api/tags
```

确保 baseUrl 正确：
```json
{
  "models": {
    "providers": {
      "ollama": {
        "baseUrl": "http://127.0.0.1:11434/v1"  // 注意 /v1
      }
    }
  }
}
```

### Q3: CognitiveRouter 不工作？

检查 Oracle 超时设置：
```json
{
  "cognitive": {
    "oracle": {
      "timeout": 1000  // 至少 1000ms
    }
  }
}
```

查看 Gateway 日志：
```bash
journalctl -u aeonsage-gateway -f
```

### Q4: Discord/Telegram Bot 不响应？

验证 token：
```bash
# Telegram
curl https://api.telegram.org/bot<YOUR_TOKEN>/getMe

# Discord（在 Gateway 日志中查看连接状态）
journalctl -u aeonsage-gateway | grep discord
```

---

## 📚 完整配置示例

### VPS 生产环境

```json
{
  "meta": {
    "description": "Production VPS Configuration"
  },
  "gateway": {
    "port": 18789,
    "bind": "0.0.0.0",
    "auth": {
      "mode": "token",
      "token": "strong-random-token-123456"
    }
  },
  "models": {
    "providers": {
      "ollama": {
        "apiKey": "ollama",
        "baseUrl": "http://127.0.0.1:11434/v1",
        "enabled": true
      },
      "openai": {
        "apiKey": "sk-proj-real-key",
        "enabled": true
      },
      "anthropic": {
        "apiKey": "sk-ant-real-key",
        "enabled": true
      }
    }
  },
  "cognitive": {
    "enabled": true,
    "oracle": {
      "enabled": true,
      "provider": "ollama",
      "model": "qwen2.5:0.5b",
      "timeout": 1000
    },
    "routing": {
      "enabled": true,
      "fallbackModel": "gpt-4o-mini"
    }
  },
  "channels": {
    "telegram": {
      "enabled": true,
      "accounts": {
        "main": {
          "enabled": true,
          "botToken": "real-telegram-token"
        }
      }
    },
    "discord": {
      "enabled": true,
      "token": "real-discord-token",
      "applicationId": "real-app-id"
    }
  },
  "session": {
    "crossChannelMemory": true,
    "persistToDisk": true
  }
}
```

---

## 🎯 配置清单

部署前确保：

- [ ] 复制 config.example.json 到 config.local.json
- [ ] 配置 Gateway 端口和绑定地址
- [ ] 设置强密码 token
- [ ] 配置至少一个模型提供商
- [ ] 如果使用 CognitiveRouter，配置 Ollama
- [ ] Oracle timeout 设置 >= 1000ms
- [ ] 配置 Channel（如果需要）
- [ ] 验证 JSON 格式
- [ ] 测试 Gateway 启动

---

**配置完成后，运行 `pnpm gateway:dev` 启动 Gateway！** 🚀

---

**最后更新**: 2026-02-08
**文档版本**: 1.0
