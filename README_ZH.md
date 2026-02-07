<div align="center">
  <a href="https://aeonsage.org">
    <img src="https://raw.githubusercontent.com/Vleonone/Aeonsage/main/assets/aeonsage_Banner.svg" alt="AEONSAGE OS" width="100%" loading="eager">
  </a>
  <br>
  
  [![Release](https://img.shields.io/badge/RELEASE-v2026.1.30-000000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/velonone/Aeonsage/releases)
  [![Core](https://img.shields.io/badge/CORE-OpenSage-000000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/velonone/Opensage)
  [![License](https://img.shields.io/badge/LICENSE-Non--Commercial-000000?style=for-the-badge&logo=gitbook&logoColor=white)](./LICENSE)
  [![Docs](https://img.shields.io/badge/DOCS-官方文档-000000?style=for-the-badge&logo=readme&logoColor=white)](https://docs.aeonsage.org)

  <br>
  <p style="font-size: 1.1em; max-width: 800px; margin: auto; padding-top: 20px; color: #666;">
    <b>确定性 · 主权级 · 智能操作系统</b><br>
    开启主权之旅: <a href="https://aeonsage.org">官方网站</a> • <a href="https://pro.aeonsage.org">企业版</a>
  </p>
</div>

<hr style="border: 0; outline: none; height: 1px; background: linear-gradient(to right, transparent, #30363d, transparent); margin: 40px 0;">

## 主权宣言 (The Sovereign Manifesto)

> **"身份先行，智能次之，工具为末。"**

在当前的 AI 浪潮中，**身份 (Identity)** 往往被视为事后补救的附庸。大模型不仅存在幻觉，更缺乏对上下文的严密保护，导致在执行关键任务时缺乏可归因性（Accountability）。

**AeonSage** 彻底逆转了这一范式。它是一个**操作系统**，将 **VDID (主权身份)** 确立为内核级的原语。在任何认知路由发生之前，系统会首先通过不可篡改的账本验证请求的来源、意图与权限。

它不仅仅是一个聊天机器人，它是一个为**经认证的自主智能体**打造的**确定性运行时环境**。

---

## 核心架构设计

AeonSage 采用严格的 **内核环 (Kernel-Ring) 架构**，强制实现认知核心与外部 I/O 的安全隔离。

### 1. 主权内核 (Ring 0)
系统的绝对核心，不可妥协。
*   **确定性状态机**: 管理 Agent 的生命周期、记忆上下文及权限边界。
*   **主动防御墙**: 启发式安全层，在 Prompt 注入与越狱攻击触达模型前将其拦截。
*   **审计日志**: 对所有高风险决策进行不可篡改的记录。

### 2. 认知路由器 (Ring 1)
抽象并统筹底层大模型的多模态推理引擎。
*   **成本感知路由**: 将复杂的逻辑分发至 SOTA 模型（如 Claude 3.5），将日常对话路由至高速本地模型。
*   **工具绑定**: 动态判断并挂载当前意图所需的 Ring 2 工具。

### 3. 能力扩展层 (Ring 2)
与纷繁复杂的数字世界交互的 I/O 层。
*   **全渠道连接**: 原生桥接 WhatsApp, Telegram, Discord, Slack 等主流平台。
*   **技能库**: 包含 GitHub 运维、Web 深度搜索、媒体控制等可执行模块。

---

## 4. 连接矩阵 (Connectivity Matrix)

操作系统提供原生协议级桥接，无需依赖第三方自动化服务（如 Zapier）。

| 协议 / 平台 | 实现方式 | 核心能力 | 状态 |
| :--- | :--- | :--- | :---: |
| **WhatsApp** | `wacli` (Baileys) | 多设备登录、媒体收发、语音笔记 | ✅ |
| **Telegram** | `MTProto` / Bot API | 私密聊天、频道管理、群组管理 | ✅ |
| **Discord** | WebSocket Gateway | 语音频道推流、Slash 指令、角色映射 | ✅ |
| **Slack** | Enterprise Grid | 线程支持、文件分析、App Home | ✅ |
| **Signal** | `libsignal` | 端到端加密 (E2EE) 通信 | ✅ |
| **Email** | SMTP / IMAP | 邮件解析、草稿撰写、附件处理 | ✅ |

---

## 5. 部署指南

### 系统要求
*   **OS**: Windows 11 / macOS 13+ / Linux Kernel 5.15+
*   **运行时**: Node.js v22.0.0+ (Active LTS)

### 快速启动 (便携版)
对于 Windows 用户，我们提供零依赖的绿色版。
1.  下载 **[AeonSage_OSS.zip](https://github.com/velonone/Aeonsage/releases/latest/download/AeonSage_OSS.zip)**。
2.  解压压缩包。
3.  运行 `AeonSage.bat`。

### 开发者安装
```bash
# 通过 NPM 全局安装
npm install -g aeonsage

# 初始化配置向导
aeonsage init

# 启动内核
aeonsage start
```

---

## 6. 官方资源

文档结构面向系统运维人员与内核开发者设计。

*   [**安装指南**](./docs/install.md)
*   [**安全策略**](./docs/security.md)
*   [**内核参考手册**](./docs/sovereign-kernel.md)
*   [**插件开发指南**](./docs/plugin.md)

---

## 7. 生态合作伙伴

我们与行业领导者共同定义主权智能的新标准。

<table>
  <tr>
    <td align="center" width="25%">
      <a href="https://vdid.org"><img src="https://raw.githubusercontent.com/Vleonone/Aeonsage/main/assets/logos/vdid-logo.svg" alt="VDID" width="80"></a><br>
      <br><b>身份层 (Identity)</b>
    </td>
    <td align="center" width="25%">
      <img src="https://raw.githubusercontent.com/Vleonone/Aeonsage/main/assets/AESE.png" alt="Kernel" width="80"><br>
      <br><b>认知内核 (Kernel)</b>
    </td>
    <td align="center" width="25%">
      <img src="https://raw.githubusercontent.com/Vleonone/Aeonsage/main/assets/AeonSage_Wisdom_2026_v4.png" alt="Research" width="100"><br>
      <br><b>研究实验室 (Labs)</b>
    </td>
    <td align="center" width="25%">
      <a href="https://velonlabs.com"><img src="https://raw.githubusercontent.com/Vleonone/Aeonsage/main/assets/velonlabs-logo.png" alt="VelonLabs" width="100"></a><br>
      <br><b>系统工程 (System)</b>
    </td>
  </tr>
</table>

---

## 许可与法律声明

**AeonSage 社区版 (Community Edition)** 采用 **MIT 许可证** 分发。

> **仅限非商业用途 (Non-Commercial Use Only)**: 尽管源代码是开源的，但 "AeonSage" 商标及 "VDID" 验证网络属于 VelonLabs 的专有技术。任何利用 AEONSAGE 品牌进行的商业衍生行为均需获得明确的企业授权。

<div align="center">
  <br>
  <b>Engineered with Precision by</b><br>
  <h3>VelonLabs & The AeonSage Core Team</h3>
  <br>
  <img src="https://img.shields.io/badge/Status-Active_Development-blue?style=flat-square" alt="Status">
</div>
