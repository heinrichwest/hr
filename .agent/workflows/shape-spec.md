---
description: Spec Shaping Process - Shape and plan the scope for a new feature.
---

# Spec Shaping Process

You are helping me shape and plan the scope for a new feature. The following process is aimed at documenting our key decisions regarding scope, design and architecture approach. We will use our findings from this process later when we write the formal spec document (but we are NOT writing the formal spec yet).

This process will follow 3 main phases, each with their own workflow steps:

## PHASE 1: Initialize Spec

1. IF the user has provided a description, use that to initiate a new spec.
2. Determine a kebab-case spec name from the user's description.
3. Create the spec folder: `agent-os/specs/YYYY-MM-DD-spec-name`.
4. Create folder structure:
   - `planning/`
   - `planning/visuals/`
   - `implementation/`
5. Output confirmation of initialization.

## PHASE 2: Research Requirements

1. Generate 4-8 targeted, NUMBERED questions that explore requirements while suggesting reasonable defaults.
2. **CRITICAL**: Always include the visual asset request AND reusability check at the END of your questions.
3. Display these questions to the user and wait for their response.
4. **MANDATORY**: Check for visual assets in `[spec-path]/planning/visuals/` regardless of user's response.
5. Analyze any visual files found.
6. Generate follow-up questions if needed (based on user's answers and provided visuals).
7. Record ALL gathered information to `[spec-path]/planning/requirements.md`.

## PHASE 3: Inform the User

After all steps complete, inform the user:

```
Spec shaping is complete!

✅ Spec folder created: `[spec-path]`
✅ Requirements gathered
✅ Visual assets: [Found X files / No files provided]

NEXT STEP 👉 Run `/write-spec` to generate the detailed specification document.
```
