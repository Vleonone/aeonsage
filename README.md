<div align="center">

<img src="./assets/aeonsage_Banner.svg" alt="AEONSAGE" width="100%" loading="eager">

**The Deterministic Foundation for Autonomous Agency**

**A Joint Release by VelonLabs & @Aeonsage**

<p>
  <a href="https://aeonsage.org">Official Site</a> •
  <a href="https://docs.aeonsage.org">Technical Documentation</a> •
  <a href="https://pro.aeonsage.org">Enterprise Solutions</a>
</p>

<p align="center">
  <a href="https://github.com/velonone/AeonsagePro/releases/latest">
    <img src="https://img.shields.io/badge/Download-macOS_Universal-000000?style=for-the-badge&logo=apple&logoColor=white" alt="Download macOS">
  </a>
  <a href="https://github.com/velonone/AeonsagePro/releases/latest">
    <img src="https://img.shields.io/badge/Download-Windows_x64-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Download Windows">
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Version-2026.1.28-blue?style=flat-square" alt="Version">
  <img src="https://img.shields.io/badge/Node-v22+-green?style=flat-square&logo=node.js" alt="Node Version">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-gray?style=flat-square" alt="License"></a>
  <a href="./docs/security.md"><img src="https://img.shields.io/badge/VDID-Verified_Identity-E8471C?style=flat-square&logo=fingerprint&logoColor=white" alt="VDID"></a>
  <a href="./README_ZH.md"><img src="https://img.shields.io/badge/Language-中文文档-red?style=flat-square" alt="Chinese"></a>
</p>

</div>

---

## 1. The Sovereign Thesis

**AeonSage** is a **Layer-2 Cognitive Fabric** engineered to solve the entropy problem of autonomous agents. Unlike stochastic "chatbot" frameworks, AeonSage provides a **Deterministic Runtime Environment** rooted in three axioms: **Identity**, **Security**, and **Economics**.

```mermaid
graph TD
    subgraph "Legacy (Entropy)"
        A[Stochastic LLM Wrappers]
        B[Leaked Intent]
        C[Unbounded Cost]
        D[Identity Spoofing]
        A --> B
        A --> C
        A --> D
    end

    subgraph "AeonSage (Sovereignty)"
        E[Deterministic Runtime]
        F[VDID Identity]
        G[Local Cognitive Router]
        H[God Key Protocol]
        E --> F
        E --> G
        E --> H
    end

    A -.->|Transformation| E
    
    style E fill:#0078D6,stroke:#333,stroke-width:2px,color:white
    style F fill:#E8471C,stroke:#333,stroke-width:2px,color:white
    style G fill:#107C10,stroke:#333,stroke-width:2px,color:white
    style H fill:#5C2D91,stroke:#333,stroke-width:2px,color:white
```

---

## 2. Architectural Specifications

### 2.1 The Cognitive Kernel (OpenSage)

The **Sovereign Cognitive Router** acts as a local-first decision engine, evaluating task complexity before routing. This architecture ensures zero telemetry for sensitive internal reasoning.

```mermaid
sequenceDiagram
    participant User
    participant Router as Sovereign Router
    participant Oracle as Local Oracle (SLM)
    participant Cloud as Cloud LLM (Tier 3)
    
    User->>Router: Submit Task
    Router->>Oracle: Analyze Complexity & Intent
    Oracle-->>Router: <Score: 0.85> (High Complexity)
    
    alt Score < 0.4 (Reflex)
        Router->>Router: Execute Locally (Groq/Local)
    else Score > 0.7 (Synthesis)
        Router->>Cloud: Route to SOTA Model (VDID Signed)
        Cloud-->>Router: Response
    end
    
    Router->>User: Deterministic Output
```

### 2.2 Defense-in-Depth Protocols

| Component | Mechanism | Objective |
| :--- | :--- | :--- |
| **The God Key** | WebSocket Kill Switch | < 50ms Global Process Termination |
| **VDID** | `did:vdid` Cryptographic Signatures | Non-Repudiation & Forensic Audit |
| **Air-Gap Mode** | Local Vector Store (ChromaDB) | Zero-Telemetry Operations |

---

## 3. Cognitive Economics

**Optimistic Cascading Logic** drastically reduces operational overhead by routing tasks to the most efficient tier.

| Cognitive Tier | Model Class | Cost Basis | Utilization Target |
| :--- | :--- | :--- | :--- |
| **Tier 1 (Reflex)** | Local SLM / Groq | **~$0.05 / 1M** | 60% of Traffic |
| **Tier 2 (Reasoning)** | GPT-4o-mini | ~$0.15 / 1M | 30% of Traffic |
| **Tier 3 (Synthesis)** | Claude 3.5 / o1 | ~$15.00 / 1M | 10% of Traffic |

---

## 4. Integration Standards

The **Channel Abstraction Layer** unifies state management across heterogeneous networks.

| Network Protocol | Integration Method | Security Context |
| :--- | :--- | :--- |
| **Telegram** | MTProto Wrapper | VDID-Signed Payloads |
| **Discord** | OAuth2 Gateway | Role-Based Access Control (RBAC) |
| **WhatsApp** | Baileys (WebSocket) | End-to-End Encryption Preserved |
| **Signal** | Libsignal Client | Local Decryption Only |
| **Terminal** | TUI Dashboard | Root / Sudo Context |

---

## 5. Deployment Protocol

### Initialization Sequence

```mermaid
graph LR
    A[Clone Repo] --> B[Hydrate Dependencies]
    B --> C[Compile Core]
    C --> D[Ignite Gateway]
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style D fill:#bbf,stroke:#333,stroke-width:2px
```

```bash
# 1. Clone Sovereign Repository
git clone https://github.com/velonone/AeonsagePro.git

# 2. Hydrate Dependencies
corepack enable && pnpm install

# 3. Compile Core
pnpm build

# 4. Ignite Gateway
pnpm aeonsage gateway
```

---

## 6. Strategic Ecosystem

AeonSage is the convergence of high-integrity sovereign technologies.

<table align="center" border="0" cellpadding="10">
  <tr>
    <td align="center" width="33%">
      <a href="https://vdid.io">
        <img src="./assets/vdid-logo.svg" alt="VDID" height="50" loading="lazy">
      </a>
      <br><br>
      <strong>Identity Layer</strong>
      <br>
      <sub>Verifiable Decentralized ID</sub>
    </td>
    <td align="center" width="33%">
      <a href="https://github.com/velonone/Opensage">
        <img src="https://img.shields.io/badge/OpenSage-Core_Engine-000000?style=for-the-badge&logo=openai&logoColor=white" alt="OpenSage" height="50" loading="lazy">
      </a>
      <br><br>
      <strong>Cognitive Kernel</strong>
      <br>
      <sub>Local-First Reasoning Router</sub>
    </td>
    <td align="center" width="33%">
      <a href="https://velonlabs.com">
        <img src="./assets/velonlabs-logo.png" alt="VelonLabs" height="50" loading="lazy">
      </a>
      <br><br>
      <strong>Research Lab</strong>
      <br>
      <sub>Sovereign Architecture</sub>
    </td>
  </tr>
</table>

---

<div align="center">
  <sub><strong>EST. 2025 · AEONSAGE COLLECTIVE · MIT LICENSE</strong></sub>
</div>
