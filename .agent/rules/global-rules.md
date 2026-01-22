---
trigger: always_on
---

# Enterprise Protocol: .NET 9 & React 19 (2026)

## 0. Standards Compliance (CRITICAL)
**Mandatory:** You MUST follow the updated coding standards defined in `agent-os/standards`.
- **Global:** `agent-os/standards/global` (Coding style, conventions, error handling)
- **Backend:** `agent-os/standards/backend` (.NET rules)
- **Frontend:** `agent-os/standards/frontend` (React/TS rules)
- **Testing:** `agent-os/standards/testing`

## 1. Antigravity Workflow & Process
**Constraint:** You must operate in **Planning Mode** for all feature work.

### Phase 1: Planning (Mandatory)
Before writing code, you must generate an **Implementation Plan Artifact** containing:
1.  **Vertical Slice Analysis**: Identify the specific Domain/Feature folder (e.g., `Features/Ordering/PlaceOrder`).
2.  **Tech Stack Confirmation**: Explicitly state libraries to be used (e.g., "Using `HybridCache` for L2," "Using `React Server Actions` for mutation").
3.  **Task Grouping**: Break the work into `Task Groups` for the `Agent Manager`.
4.  **Verification Strategy**: Define how you will verify success (e.g., "Browser Agent will navigate to /login and verify 200 OK").

### Phase 2: Execution
- **Atomic Changes**: Edit max 2 files per step.
- **Artifact Updates**: Update the `Implementation Plan` status to [x] as you complete steps.
- **Supply Chain Check**: Run `npm view <package>` or `dotnet list package` before importing new dependencies.

### Phase 3: Verification
- **No Manual Tests**: You must use the **Browser Agent** or **Testcontainers** to verify.
- **Definition of Done**:
    - [ ] No Linter/Compiler Errors.
    - [ ] Tests Passed (Green).
    - [ ] Unused imports removed.
    - [ ] Public API documented.

---

## 3. Frontend Rules: React 19 & TypeScript
**Context**: React Compiler is enabled. Manual optimizations are obsolete.

### Core React 19 Patterns
- **Server Components**: All files are `.tsx` Server Components by default. Use `"use client"` only at leaf nodes.
- **No Memoization**: **DO NOT** use `useMemo`, `useCallback`, or `memo()` unless bridging legacy libs. Rely on React Compiler.
- **Data Fetching**: Use `Suspense` and `use(promise)`. **FORBIDDEN**: `useEffect` for data fetching.
- **Mutations**: Use **Server Actions** (`async function action(formData) { 'use server' }`). **FORBIDDEN**: `onSubmit` handlers calling API routes manually.

### TypeScript (Node Native)
- **Syntax**: Must be compatible with Node `--experimental-strip-types`.
- **FORBIDDEN**: `enum` (Use `const` objects), `namespace`, `constructor(public prop)`.
- **Strictness**: `noImplicitAny: true`. Explicit return types on all exported functions.

### UI & Styling
- **Stack**: Tailwind CSS v4 + Shadcn/UI.
- **Pattern**: Use utility classes. **FORBIDDEN**: CSS-in-JS (Styled Components) or runtime styles.

---

## 4. DRY Protocol (Smart Reuse)
- **Shared Kernel**: Only share **Infrastructure** (Pipeline Behaviors, Middleware, Value Objects).
- **Vertical Isolation**: **DO NOT** share "Business Logic" between features. If `CreateOrder` and `UpdateOrder` are 90% similar, copy the code. Decoupling > DRY.
- **Frontend Composition**: Create `Container Components` for data fetching logic to avoid repeating `Suspense` boundaries.
