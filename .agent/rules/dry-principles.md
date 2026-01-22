---
trigger: always_on
---

## DRY Protocols (Don't Repeat Yourself)

**Guideline:** DRY applies to **Infrastructure** and **UI Patterns**, NOT Business Logic.

### Backend (.NET 9) - The "Shared Kernel" Rule
- **MediatR Pipelines:** NEVER write `try/catch`, `logging`, or `validation` logic inside a Request Handler.
    - *Action:* Use **Generic Behaviors** (`IPipelineBehavior<TRequest, TResponse>`) for:
        - Validation (`FluentValidation`).
        - Transaction Management (`UnitOfWork`).
        - Caching (`HybridCache` wrapper).
        - Exception Handling.
- **Extension Methods:** If you write the same 3 lines of LINQ or configuration code twice, create an extension method.

    - *Pattern:* `builder.Services.AddMyFeatureInfrastructure()` instead of repeating 20 lines of DI config in `Program.cs`.
- **Value Objects:** Do not repeat primitive validation.
    - *Bad:* Validating "Email" string format in 10 different handlers.
    - *Good:* Create a shared `EmailAddress` Value Object that validates itself upon creation. Use it everywhere.
- **Mappers:** Do not write manual property assignments (`Dest.Prop = Src.Prop`) for massive objects.
    - *Action:* Use **Mapster** or static `ToDto()` extension methods close to the domain entity.

### Frontend (React 19) - The "Composition" Rule
- **UI Components (Shadcn/UI):** NEVER hardcode HTML elements (divs, buttons) with raw Tailwind classes for standard UI elements.
    - *Strictness:* You MUST import from `@/components/ui/...`. If a variant is missing, update the generic component using `cva` (Class Variance Authority), do not override it locally.
- **Server Action Wrappers:** Do not repeat `try/catch` blocks in Server Actions.
    - *Action:* Create a Higher-Order Function `safeAction(fn)` that handles:
        - Auth checks.
        - Input validation (Zod).
        - Error serialization to the UI.
- **Data Fetching:** Do not repeat `use(promise)` patterns with manual Suspense boundaries for every component.
    - *Action:* Create reusable "Container Components" or custom hooks that encapsulate the data requirement.

- **Tailwind Config:** Do not repeat magic numbers (colors, spacing).
    - *Action:* Define them in `tailwind.config.ts` (theme extensions) and reference them via utility classes (e.g., `bg-primary`, `p-layout-md`).

### The "Rule of Three" (Agent Constraint)
- If the Agent generates a block of code that looks identical to an existing block in another file:
    1.  **Stop.**
    2.  **Refactor** the common logic into a Shared Utility (`src/Shared/` or `@/lib/utils`).
    3.  **Implement** the new feature using the utility.
    - *Exception:* Do NOT share "Feature Logic". If `CreateOrder` and `UpdateOrder` look similar, KEEP them separate. Logic diverges; infrastructure stays the same.