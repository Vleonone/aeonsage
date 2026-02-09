# AeonSafe 安全工具模块

> AeonSage 内置安全评估工具包,基于 [guardian-cli](https://github.com/zakirkun/guardian-cli) 架构。

> **后台权限工具** - 仅供 Agent 内部调用,不暴露 UI 界面。

## 架构

```
src/security/
├── index.ts          # 模块入口
├── tool-runner.ts    # 通用执行器
└── tools/
    ├── index.ts      # 工具导出
    ├── nmap.ts       # 网络扫描
    ├── nuclei.ts     # 漏洞检测
    └── httpx.ts      # HTTP 探测
```

## 工具分类

### Network Scanning
| 工具 | 文件 | 功能 | 风险 |
|-----|------|------|-----|
| nmap | `nmap.ts` | 端口扫描/服务发现 | HIGH |
| masscan | 待实现 | 高速端口扫描 | HIGH |

### Web Reconnaissance
| 工具 | 文件 | 功能 | 风险 |
|-----|------|------|-----|
| httpx | `httpx.ts` | HTTP 探测/指纹 | MEDIUM |
| whatweb | 待实现 | 技术识别 | LOW |
| wafw00f | 待实现 | WAF 检测 | LOW |

### Vulnerability Scanning
| 工具 | 文件 | 功能 | 风险 |
|-----|------|------|-----|
| nuclei | `nuclei.ts` | CVE 检测 | CRITICAL |
| nikto | 待实现 | Web 漏扫 | HIGH |
| sqlmap | 待实现 | SQL 注入 | CRITICAL |

## 使用方法

```typescript
import { runNmap, runNuclei, isToolAvailable } from "../security/index.js";

// 检查工具可用性
if (await isToolAvailable("nmap")) {
  const result = await runNmap("192.168.1.1", {
    scanType: "quick",
    timeout: 120,
  });
  console.log(result.parsed.findings);
}
```

## Gateway API

```
POST /api/kali/scan/network      → executeNetworkScan (nmap)
POST /api/kali/scan/port         → executePortScan (nmap)
POST /api/kali/scan/vulnerability → executeVulnerabilityScan (nuclei)
```

## 安全约束

- 所有扫描需要 `authorized: true`
- 外部 IP 需要人工确认
- 默认仅允许 localhost/workspace
- 所有操作记录审计日志

## Docker 安装

```bash
docker build \
  --build-arg AEONSAGE_DOCKER_APT_PACKAGES="nmap nikto" \
  -t aeonsage:security .
```

## 添加新工具

1. 在 `tools/` 创建 `{toolname}.ts`
2. 实现 `run{Tool}()` 和 `parse{Tool}Output()`
3. 在 `tools/index.ts` 导出
4. 在 `tool-runner.ts` 的 `GUARDIAN_TOOLS` 添加元数据
5. 更新本文档

---

*Version: 1.0.0 | 2026-02-07*
