---
description: Task List Creation Process - Create a tasks breakdown from a given spec and requirements.
---

# Task List Creation Process

You are creating a tasks breakdown from a given spec and requirements for a new feature.

## PHASE 1: Get and read the spec.md and/or requirements document(s)

You will need ONE OR BOTH of these files to inform your tasks breakdown:
- `agent-os/specs/[this-spec]/spec.md`
- `agent-os/specs/[this-spec]/planning/requirements.md`

IF you don't have ONE OR BOTH of those files, ask the user to provide direction.

## PHASE 2: Create tasks.md

1. Break down the spec and requirements into an actionable tasks list with strategic grouping and ordering.
2. Consider `spec.md`, `requirements.md`, and any visual assets in `planning/visuals/`.
3. Create `tasks.md` inside the spec folder.

## PHASE 3: Inform User

Once `tasks.md` is created, output the following:

```
Your tasks list ready!

✅ Tasks list created: `agent-os/specs/[this-spec]/tasks.md`

NEXT STEP 👉 Run `/implement-tasks` (simple, effective) or `/orchestrate-tasks` (advanced, powerful) to start building!
```
