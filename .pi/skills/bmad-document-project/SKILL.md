---
name: bmad-document-project
description: |
  BROWNFIELD planning input. Scans an existing codebase READ-ONLY and writes
  project-documentation.md — ground truth for stack, structure, key flows,
  conventions, and integration points — so downstream BMAD planning skills
  start from reality. Does NOT modify code; produces only the doc artifact.

  Use when the user says: "document this codebase", "document the project",
  "document my app", "scan the existing code", "brownfield planning",
  "we have existing code, start planning", "map what's already built",
  "document current state", "capture the current architecture",
  "understand the existing system before planning",
  "write project-documentation.md", or before a PRD or architecture doc
  when the user already has code written.

  Three intents: Create (initial scan), Update (re-scan changed areas),
  Validate (check completeness). Plans only — reads code but never writes
  it, runs no tests, no linters, no build tools, no application code.
allowed-tools: Read, Glob, Grep, Write, TodoWrite
---

# BMAD Document Project

**BROWNFIELD entry point.** When a project already has code, planning skills need
ground truth — not guesses about the stack or conventions. This skill performs a
systematic, READ-ONLY codebase scan and emits `project-documentation.md`, the
authoritative current-state snapshot that every downstream BMAD planning skill loads.

**No code is written, modified, or executed.** Allowed tools are Read, Glob, Grep,
Write (for the output document only), and TodoWrite (to track scan progress).

---

## Output

`bmad-output/project-documentation.md`  
(or the user-configured output folder — honor it)

Load `bmad-output/project-context.md` if it exists; merge any constraints already
recorded there rather than rediscovering them from scratch.

---

## Three Intents

Ask which intent applies if ambiguous; never silently regenerate an existing document.

### Create — initial scan

Use TodoWrite to track the six scan passes below. Complete every pass before writing
the final document.

**Pass 1 — Repository skeleton**

```
Glob: **/* (depth ≤ 3, exclude node_modules, .git, dist, build, __pycache__, .venv)
Glob: *.md, *.txt, *.rst at root and docs/
```

Capture: directory tree shape, presence of monorepo markers (`packages/`,
`apps/`, `libs/`), top-level config files, documentation roots.

**Pass 2 — Stack and toolchain**

Read whichever of these exist (don't fail on missing files):

| File | What to extract |
|------|----------------|
| `package.json` / `package-lock.json` | runtime + dev deps, scripts |
| `pyproject.toml` / `requirements*.txt` / `Pipfile` | Python stack |
| `go.mod` | Go module + dependencies |
| `Cargo.toml` | Rust crate |
| `pom.xml` / `build.gradle` | JVM stack |
| `Gemfile` | Ruby stack |
| `composer.json` | PHP stack |
| `*.csproj` / `*.sln` | .NET stack |
| `Dockerfile` / `docker-compose*.yml` | container strategy |
| `.github/workflows/*.yml` / `*.gitlab-ci.yml` / `Jenkinsfile` | CI/CD chain |
| `*.tf` / `*.bicep` / `*.yaml` (in infra/) | IaC / cloud provider |

Record: primary language, frameworks, major libraries, runtime version pins,
test frameworks (note them — do NOT run them), build tool, package manager.

**Pass 3 — Entry points and key flows**

```
Grep: "main\|entrypoint\|app\.listen\|createServer\|handler\|router\|routes"
Grep: "export default\|module\.exports\|@app\.route\|@Controller\|@RestController"
```

Read the top-level entry files surfaced (max 5–8 files; skim, don't exhaustively read).

Capture: how the app starts, primary routing layer, authentication/middleware chain
(names only), background workers or queues detected.

**Pass 4 — Module / domain structure**

Read directory names and `index.*` / `__init__.*` files one level down from `src/`,
`app/`, `lib/`, or the equivalent.

```
Glob: src/**/index.{ts,js,py,go,rb}
Glob: app/**/__init__.py
```

Capture: module names and inferred responsibility, layer boundaries (controllers /
services / repositories / models / utils), shared utilities.

**Pass 5 — Conventions and patterns**

Sample 3–5 representative files per layer (prefer recently modified if discernible
from file names / path depth):

```
Grep: "class \|interface \|type \|enum " — naming style
Grep: "async \|await \|Promise\|goroutine\|concurrent" — concurrency pattern
Grep: "import \|require\|from " — module resolution style
Grep: "console\.log\|logger\.\|log\." — logging approach
Grep: "\.env\|process\.env\|os\.environ\|config\." — config/secrets pattern
```

Capture: naming conventions (casing style for files, classes, functions), error
handling style, logging approach, config/secrets management, test file location
convention (name only — no execution).

**Pass 6 — Integration points**

```
Grep: "http[s]\?://\|fetch(\|axios\.\|requests\.\|http\.Get\|RestTemplate"
Grep: "database\|db\.\|pool\.\|prisma\.\|mongoose\.\|sqlx\.\|gorm\."
Grep: "redis\|kafka\|rabbitmq\|sqs\|pubsub\|queue\|event"
Grep: "s3\.\|storage\.\|blob\.\|bucket"
```

Capture: external HTTP APIs called (domains/service names, not secrets), database
type and ORM/driver, message queues or event buses, object storage, third-party
services (payment, email, auth providers — names only).

**Write the document**

Fill `${CLAUDE_PLUGIN_ROOT}/skills/bmad-document-project/templates/project-documentation.template.md`
→ `bmad-output/project-documentation.md`.

Use the Write tool. Leave sections with a `<!-- not detected -->` comment rather
than inventing content. Accuracy over completeness.

---

### Update — re-scan changed areas

1. Read existing `project-documentation.md`.
2. Ask the user which areas changed (new module? new dependency? refactor?).
3. Re-run only the relevant passes above for those areas.
4. Edit the document surgically with precise rewrites of changed sections.
5. Append a dated update note at the bottom of the document.

Do NOT regenerate the full document from scratch if only part has changed.

---

### Validate — check completeness

Read the existing `project-documentation.md` and verify:

- [ ] All six scan areas have content (not blank or "not detected" for everything)
- [ ] Stack section names the primary language, framework, and major deps
- [ ] Entry points section names at least one bootstrap/start file
- [ ] Module structure lists recognizable domain names
- [ ] Conventions covers naming style and error handling
- [ ] Integration points lists external dependencies (or explicitly states "none")
- [ ] No fabricated file paths (cross-check one or two with Glob)

Report a pass/fail checklist. Offer to fill gaps rather than silently editing.

---

## Scope Boundary

This skill is READ-ONLY except for its single output document. It:

- Does NOT modify any source file.
- Does NOT run tests, build scripts, linters, or coverage tools.
- Does NOT generate application code, migration files, or fixtures.
- Does NOT implement features or review diffs.

If a scan reveals something worth fixing, record it as a planning note in the
document — do not fix it.

---

## Handoff

Once `project-documentation.md` is written, it becomes the brownfield input for:

- **bmad-init** — seed `project-context.md` with the detected stack and constraints.
- **bmad-prd** — ground truth for existing capabilities and integration constraints.
- **bmad-architecture** — baseline architecture to evolve rather than design from scratch.
- **bmad-tech-spec** (Quick Flow) — concrete starting point for a focused spec.

State the recommended next step when the document is ready.

---

## Persona Note

This analysis role aligns with Mary (Business Analyst) in the BMAD Method — start
with what exists before prescribing what should change. The document is her
field notes: precise, sourced, free of conjecture.

---

> ---
> Part of the **BMAD Planning & Orchestrator** plugin — a Claude Code harness for the **BMAD Method** by the **BMAD Code Organization** (https://github.com/bmad-code-org/BMAD-METHOD). Implements the spirit of `bmad-document-project`. All methodology credit belongs to the BMAD Code Organization.
