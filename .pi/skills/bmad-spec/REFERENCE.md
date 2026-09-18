# BMAD Spec — Extended Distillation Reference

Companion to `SKILL.md`. Load only when handling edge cases or ambiguous input.

---

## Extended Distillation Patterns

### Overloaded Problem statements

When the input contains multiple distinct pain points, resist merging them. Instead:

1. List all pain points verbatim during the Extract phase.
2. Ask the user: "I see N distinct problems — which one are we solving in this initiative?"
3. Capture the primary in **Problem** and the others as **Non-Goals** ("Addressing [X] is deferred to a separate initiative").

If the user genuinely needs all pain points addressed together, treat that as a signal the initiative is too broad. Flag it: "This scope may warrant splitting into two SPEC/PRD pairs — want to proceed as one or split now?"

### Feature-list inputs (no outcomes stated)

Input pattern: "We want a dashboard with filters, export to CSV, role-based access, and a notification system."

1. For each feature, ask: "What does a user accomplish by having this?"
2. Rephrase as outcomes: "users can monitor X at a glance", "analysts can share results without manual steps", etc.
3. If the user insists on feature language, honor it but annotate: `<!-- outcome unclear; confirm with PM before handing to tech-spec -->`

### Transcript inputs

Long transcripts (meeting recordings, interview notes) often contain:
- Contradictory statements (someone says "we must support mobile" and someone else says "mobile is out of scope")
- Aspirational ideas that are not constraints
- Implicit non-goals (things no one mentioned that a reader might assume)

Handling:
1. Scan for contradictions first. Surface them explicitly before drafting the SPEC fields.
2. Flag aspirational statements: "I heard 'we'd like to launch by Q4' — is that a hard deadline or a preference?"
3. Derive Non-Goals from gaps: if the transcript is silent on internationalization, add it as a Non-Goal unless the domain clearly requires it.

### Input that is already a PRD

When the user hands over a full PRD (even a long one), the task is compression, not invention.

1. Map each PRD section to a SPEC field using the heuristics table in SKILL.md.
2. Strip implementation detail, architecture choices, and feature specifications — those stay in the PRD.
3. The resulting SPEC is a summary kernel, not a replacement. Note in the SPEC header: `Source: compressed from existing PRD`.
4. Offer to update the PRD to cross-reference the new SPEC.

### Regulatory/compliance-heavy inputs

When inputs include compliance language (HIPAA, GDPR, PCI-DSS, SOC 2, FedRAMP):
- Regulatory requirements that are non-negotiable → **Constraints**
- Compliance goals that will be verified downstream → **Success Metrics** (e.g., "zero findings in next audit")
- Regulatory scope that is explicitly out → **Non-Goals** (e.g., "SOC 2 Type II certification is deferred to a future cycle")

Never interpret regulatory language yourself — surface it as stated and flag it: `<!-- confirm interpretation with legal/compliance before locking SPEC -->`

### Missing success metrics

When the input has no measurable signals:
1. Use the Problem statement as a proxy: reverse the failure state into a success state.
   - Problem: "users spend 45 min per review" → Metric: "average review time ≤ 10 min"
   - Problem: "fraud detection rate is 60%" → Metric: "fraud detection rate ≥ 85%"
2. If no numeric baseline exists, the metric becomes: "Baseline measured within 30 days of launch; target set at planning review."
3. Never fabricate numbers. Use ranges from the input, or acknowledge the unknown.

### Scope ambiguity — "just like [existing product]"

Input: "Build something like Notion but for internal wikis."

Danger: the reference product has dozens of features. Extract only what the Problem requires:
1. Ask: "Which specific capability of [product] is missing from your current setup?"
2. Scope **Capabilities** to the answer, not the full product surface.
3. Add as Non-Goal: "Feature parity with [product] — only capabilities addressing [problem] are in scope."

---

## Update Intent — Detailed Protocol

When the user wants to revise an existing SPEC:

1. Read `bmad-output/SPEC.md` (or the configured output path).
2. Read `bmad-output/decision-log.md` to understand prior decisions.
3. Identify what has changed: new information, changed constraints, descoped items.
4. Present a summary of changes before writing: "I'll update these fields: [list]. Here's the diff..."
5. Confirm with the user.
6. Overwrite `SPEC.md` and append to `decision-log.md`:

```markdown
## SPEC updated — <ISO date>
- Changed fields: <list>
- Reason: <one-sentence rationale>
- Supersedes decision from: <prior date if applicable>
```

7. Check whether downstream artifacts (PRD, tech-spec) reference the changed fields. If so, warn: "These downstream artifacts may need updating: [list]."

---

## Validate Intent — Checklist

Run this checklist when the user asks to validate an existing SPEC:

- [ ] All five fields present and non-empty
- [ ] **Problem** is one coherent statement (not a list of features)
- [ ] **Capabilities** are outcome-framed ("users can …" or "the system supports …"), not feature-lists
- [ ] **Constraints** are truly non-negotiable (not soft preferences)
- [ ] **Non-Goals** are specific and unambiguous (not vague disclaimers)
- [ ] **Success Metrics** are measurable (each has a number, threshold, or observable boolean)
- [ ] No implementation technology named in Capabilities
- [ ] No story points, velocity, or burndown language anywhere
- [ ] Track field is set (quick-flow | bmad-method | enterprise)
- [ ] Status field is current (draft | confirmed | superseded)

For each failed check, offer to fix it in place.

---

## Track Selection Heuristic

When no track is chosen, suggest one based on scope signals in the SPEC:

| Signal | Suggested track |
|---|---|
| ≤ 15 estimated stories, single team, clear tech | Quick Flow |
| 10–50 stories, product + engineering coordination needed | BMad Method |
| 30+ stories, security review, DevOps, or compliance gates required | Enterprise |

Always confirm with the user: "Based on scope, I'd suggest [track] — does that fit your situation?"

The track field in the SPEC header is informational. The binding track decision is recorded in `decision-log.md` and confirmed when `bmad-init` is run (or the orchestrator opens the workspace).

---

> ---
> Part of the **BMAD Planning & Orchestrator** plugin — a Claude Code harness for the **BMAD Method** by the **BMAD Code Organization** (https://github.com/bmad-code-org/BMAD-METHOD). Implements the spirit of `bmad-spec`. All methodology credit belongs to the BMAD Code Organization.
