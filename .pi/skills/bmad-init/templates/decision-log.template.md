# Decision Log — {{PROJECT_NAME}}

A threaded, append-only record of decisions made across BMAD planning workflows.
Every later skill (brief, PRD, architecture, stories) appends here so the reasoning
behind the plan stays visible and consistent.

**How to use:** add a new entry at the top of the log (newest first). Never rewrite
or delete past entries — supersede them with a new entry that references the old one.

## Entry format

```
### YYYY-MM-DD — <short title>
- **Decision:** <what was decided>
- **Rationale:** <why; alternatives considered>
- **Made by:** <skill/workflow, e.g. bmad-init, prd, architecture>
- **Supersedes:** <link to prior entry, if any>
```

---

### {{TIMESTAMP_DATE}} — Track selected: {{PROJECT_TRACK}}
- **Decision:** Initialized this project on the **{{PROJECT_TRACK}}** track.
- **Rationale:** _(fill in: scope signals — story count, teams, compliance/infra —
  that drove the choice)_
- **Made by:** bmad-init
- **Supersedes:** none
