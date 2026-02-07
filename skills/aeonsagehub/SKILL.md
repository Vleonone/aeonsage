---
name: aeonsagehub
description: Use the AeonSageHub CLI to search, install, update, and publish agent skills from aeonsagehub.com. Use when you need to fetch new skills on the fly, sync installed skills to latest or a specific version, or publish new/updated skill folders with the npm-installed aeonsagehub CLI.
metadata: {"aeonsage":{"requires":{"bins":["aeonsagehub"]},"install":[{"id":"node","kind":"node","package":"aeonsagehub","bins":["aeonsagehub"],"label":"Install AeonSageHub CLI (npm)"}]}}
---

# AeonSageHub CLI

Install
```bash
npm i -g aeonsagehub
```

Auth (publish)
```bash
aeonsagehub login
aeonsagehub whoami
```

Search
```bash
aeonsagehub search "postgres backups"
```

Install
```bash
aeonsagehub install my-skill
aeonsagehub install my-skill --version 1.2.3
```

Update (hash-based match + upgrade)
```bash
aeonsagehub update my-skill
aeonsagehub update my-skill --version 1.2.3
aeonsagehub update --all
aeonsagehub update my-skill --force
aeonsagehub update --all --no-input --force
```

List
```bash
aeonsagehub list
```

Publish
```bash
aeonsagehub publish ./my-skill --slug my-skill --name "My Skill" --version 1.2.0 --changelog "Fixes + docs"
```

Notes
- Default registry: https://aeonsagehub.com (override with AEONSAGEHUB_REGISTRY or --registry)
- Default workdir: cwd (falls back to AeonSage workspace); install dir: ./skills (override with --workdir / --dir / AEONSAGEHUB_WORKDIR)
- Update command hashes local files, resolves matching version, and upgrades to latest unless --version is set
