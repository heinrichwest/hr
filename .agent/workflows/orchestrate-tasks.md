---
description: Orchestration Process - Orchestrate implementation of task groups.
---

# Process for Orchestrating a Spec's Implementation

Now that we have a spec and tasks list ready for implementation, we will proceed with orchestrating implementation of each task group.

## Multi-Phase Process

### FIRST: Get tasks.md for this spec
Ensure `agent-os/specs/[this-spec]/tasks.md` exists.

### NEXT: Create orchestration.yml
Create `agent-os/specs/[this-spec]/orchestration.yml` with the names of each task group:
```yaml
task_groups:
  - name: [task-group-name]
```

### NEXT: Assign subagents (Interpreted for Antigravity)
Ask the user to assign roles or confirm the plan for each task group.

### NEXT: Delegate and Implement
Loop through each task group and implement them, marking them off in `tasks.md`.
