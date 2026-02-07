---
name: learn-skillsmp
description: |
  Autonomous learning and ingestion of specialized knowledge from SkillsMP (https://skillsmp.com/). 
  Use when the Observer wants to expand AeonSage's intelligence by internalizing external skill documentation, tutorials, or protocols.
  
  **IMPORTANT**: Learning from external portals involves continuous AI reasoning and high API TOKEN consumption.
---

# 🎓 Learn SkillsMP | 智能学习协议

This skill enables AeonSage to harmonize with external knowledge sources from the SkillsMP platform.

## ⚖️ Disclaimer
**API Token Consumption**: Ingesting and internalizing complex skills from SkillsMP involves a "Multi-stage Cognitive Loop" (Synthesis -> Validation -> Manifestation). This process is **TOKEN INTENSIVE**. The user accepts full responsibility for all API costs and tokens consumed during this autonomous learning phase.

## 🛠️ Operational Protocol

### 1. Identify Target
Specify the URL of the skill or knowledge pack on `https://skillsmp.com/`.

### 2. Cognitive Ingestion
When requested to "Learn" or "Ingest" a skill:
1.  **Grep/Read**: Access the provided URL (via `read_url_content` or manual input).
2.  **Harmonize**: Transform the external documentation into the AeonSage standard (`SKILL.md` + resources).
3.  **Manifest**: Create a new subdirectory in `skills/` for the learned module.

### 3. Verification
Run the `skill-creator` validation script to ensure the learned skill is compatible with the AeonSage substrate.

---

> [!NOTE]
> This skill acts as a bridge between the planetary knowledge of SkillsMP and the personal sovereignty of AeonSage.
