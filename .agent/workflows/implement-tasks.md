---
description: Spec Implementation Process - Implement the tasks defined in tasks.md.
---

# Spec Implementation Process

Now that we have a spec and tasks list ready for implementation, we will proceed with implementation of this spec by following this multi-phase process:

## PHASE 1: Determine which task group(s) to implement

1. Check if the user has already provided instructions about which task group(s) to implement.
2. IF NOT, read `agent-os/specs/[this-spec]/tasks.md` and ask the user which tasks to implement.

## PHASE 2: Implement the Tasks

1. Analyze `spec.md`, `requirements.md`, and any visuals.
2. Analyze patterns in the codebase according to its built-in workflow.
3. Implement the assigned task group according to requirements and standards in `agent-os/standards/`.
4. Update `agent-os/specs/[this-spec]/tasks.md` to mark completed tasks with `- [x]`.

## PHASE 3: Produce the final verification report

1. IF ALL task groups are marked complete, run final verifications.
2. Produce the final verification report in `agent-os/specs/[this-spec]/verifications/final-verification.md`.
