# Security Policy

AeonSage handles sensitive identity and cognitive data. Security is a core priority.
We employ a **Defense in Depth** strategy — layering kernel isolation, identity verification, and behavioral monitoring.

---

## Supported Versions

Only the latest stable release receives active security patches.

| Version | Status |
| :--- | :--- |
| **Latest (`main`)** | Active Support |
| Previous releases | Not supported |

---

## Reporting a Vulnerability

**Do not open public GitHub issues for security vulnerabilities.**

Please email **security@velonlabs.com** with the subject line:

```
[SECURITY] - Brief description of the vulnerability
```

We will:
1.  Acknowledge receipt within **48 hours**.
2.  Provide a triage assessment and estimated timeline.
3.  Coordinate disclosure after a fix is available.

### In Scope

*   **Identity Spoofing** — Bypassing VDID or authentication layers
*   **Remote Code Execution** — Breaking out of the cognitive sandbox
*   **Prompt Injection** — System prompt override leading to privileged action execution
*   **Data Leakage** — Unauthorized access to session data or vector memory
*   **Gateway Bypass** — Circumventing API authentication or authorization

### Out of Scope

*   LLM hallucinations or social engineering of the model
*   Attacks requiring physical access to the host machine
*   Denial of Service (DoS) on self-hosted instances
*   Vulnerabilities in third-party dependencies (report upstream)

---

## Security Architecture

AeonSage employs multiple defense layers:

1.  **Role Enforcement** — Guest users cannot invoke Admin-level skills. Permission boundaries are enforced at the Gateway middleware layer.
2.  **Audit Logging** — All security-critical events are logged immutably.
3.  **Input Validation** — All external inputs are sanitized before reaching the kernel.
4.  **JWT Verification** — Tokens are verified server-side with signature, tier, and device fingerprint checks.

---

**Copyright 2026 VelonLabs & The AeonSage Contributors.**
