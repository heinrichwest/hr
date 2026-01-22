# New Rule (Intent-first, scope-aware)
## Description
Creates a new Rules file in the correct scope (global vs workspace) **only after** 1) understanding intent and scope, 2) doing research if context is missing, 3) showing the draft and getting confirmation.

## Steps
### 1) Clarify intent (no file writes yet)
Ask:
- Is this rule GLOBAL or PROJECT/WORKSPACE?
- What is the rule trying to enforce? (behavior, style, safety, quality, process)
- Which languages/tools/frameworks does it apply to?
- Should it be strict (must) or guidance (should)?
- Naming convention? (e.g., 00-*, quality-*, security-*)
If answers already exist, restate them as a checklist.

### 2) Research (only if needed)
If the user did not provide enough context:
- Inspect the repo for conventions:
  - existing .agent/rules/
  - lint configs (eslint, prettier, ruff, black, etc.)
  - testing conventions
  - CI rules and commit conventions
- If still unclear, do web research (official docs first) and summarize findings.

### 3) Draft the rule file (content only)
Generate:
- Proposed filename + location:
  - Workspace rules: .agent/rules/<name>.md
  - Global rules: (users global config location  ask them where their global Antigravity home is)
- Rule content in Markdown:
  - Title
  - Bullet rules (short, enforceable)
  - When to ask questions trigger section
  - Change control section (show diff + confirm before write)
  - Quality bar section (tests/lint/docs where relevant)

### 4) Confirmation gate
Ask: "Confirm: should I create/update this rule in the selected scope now?"
If NO: stop after draft.
If YES: proceed.

### 5) Write safely
- Create directory if missing
- If file exists:
  - merge carefully, avoid duplicates
  - preserve user edits
- Output:
  - created/updated path
  - summary of what changed

### 6) Usage note
Explain how the rule will influence the agent and how to refine it.
