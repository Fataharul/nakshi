# AGENTS.md

## 1. Read Project Context

Before starting any task, read the relevant files in `.context/` to understand the project's requirements, architecture, decisions, progress, and design rules.

At minimum, review:

- `.context/requirements.md`
- `.context/architecture.md`
- `.context/decisions.md`
- `.context/progress.md`

For **UI-related tasks**, also read:

- `.context/DESIGN.md`
- `.context/DESIGN_DIRECTION.md`

### Design File Responsibilities

Use the design files according to their purpose:

- **`DESIGN.md`** — canonical implementation source of truth for the UI design system. Use it for exact colors, typography, spacing, layout, breakpoints, radii, elevation, component rules, accessibility values, and other implementation-level design decisions.
- **`DESIGN_DIRECTION.md`** — product-level visual and UX direction. Use it to understand the intended visual character, experience, artwork presentation, marketplace/exhibition patterns, interaction principles, and responsive UX direction.

When the two design files appear to conflict:

1. Follow the exact implementation values and rules in `DESIGN.md`.
2. Use `DESIGN_DIRECTION.md` to understand the intended experience and design rationale.
3. If the conflict cannot be resolved from the documents, identify it during planning rather than silently inventing a solution.

Do not introduce UI patterns that contradict either document without explicitly identifying the deviation and receiving approval.

If any required context file is missing, incomplete, contradictory, or appears outdated, identify the issue before implementation rather than assuming its contents.

---

## 2. Analyze the Task and Constraints

Before proposing an implementation:

- Understand the user's requested outcome.
- Inspect the relevant existing code and project structure.
- Identify applicable requirements and architectural constraints.
- Check existing decisions in `decisions.md`.
- For UI work, check the applicable rules in `DESIGN.md` and direction in `DESIGN_DIRECTION.md`.
- Identify dependencies, potential side effects, and affected areas.
- Determine what needs to be changed and what should remain untouched.

Existing project decisions should be treated as constraints unless the task explicitly requires changing them.

---

## 3. Create an Implementation Plan — STOP & WAIT

Before writing or modifying code, provide a clear step-by-step implementation plan.

The plan should include:

1. What will be changed.
2. Which files/components will be affected.
3. How the implementation will work.
4. Any important technical or UI decisions.
5. How the result will be verified.
6. Any relevant documentation/context updates.

For UI-related work, explicitly mention how the implementation will follow:

- `DESIGN.md`
- `DESIGN_DIRECTION.md`

**STOP and wait for explicit user approval before implementing the plan.**

Feedback, questions, or discussion about the plan do not constitute approval unless the user clearly approves proceeding.

---

## 4. Execute the Approved Task

After approval:

- Implement only the approved scope.
- Follow the existing architecture and project conventions.
- Follow documented decisions unless an approved change is required.
- For UI work, follow `DESIGN.md` as the implementation source of truth and `DESIGN_DIRECTION.md` for the intended product experience.
- Avoid unnecessary refactoring or unrelated changes.
- Keep the implementation consistent with existing components and patterns.
- If the approved approach needs to change materially during implementation, stop and inform the user before proceeding with the new approach.

---

## 5. Verify the Implementation

After implementation, verify that the changes work as intended.

Use the project's available verification methods, such as:

- Type checking
- Linting
- Unit tests
- Integration tests
- Build checks
- Relevant automated tests
- Manual UI verification when appropriate

For UI-related changes, also verify that the implementation is consistent with:

- The design tokens and component rules in `DESIGN.md`
- The visual and UX direction in `DESIGN_DIRECTION.md`
- Responsive behavior
- Accessibility requirements

If verification cannot be performed, clearly state what could not be verified and why.

---

## 6. Update Project Context

After a successful implementation, update the relevant files in `.context/`.

### `decisions.md`

Add an entry when a meaningful technical, architectural, or design decision has been made that should guide future work.

Examples:

- Choosing a library or framework approach
- Changing an architectural pattern
- Establishing a reusable implementation pattern
- Making a significant UI/UX implementation decision not already covered by the design documents

Do not add trivial implementation details.

### `progress.md`

Record meaningful milestones with a timestamp.

Include:

- What was completed.
- What was verified.
- Any important remaining work or known limitations.

Do not record every small code change.

### Design Documentation

If a task reveals a **new reusable design-system rule** that should apply across the project, do not silently add it to a single component.

Instead:

1. Identify the design-system change.
2. Explain it during planning.
3. Get approval if it changes the established design system.
4. Update `DESIGN.md` when appropriate.
5. Update `DESIGN_DIRECTION.md` only when the change affects the broader visual or UX direction.

Do not duplicate exact design tokens between the two design files.

---

## 7. Update `README.md`

Keep `README.md` accurate and useful as the project's user-facing documentation.

Update it when the implementation introduces or changes information that users or developers need to know.

Where relevant, `README.md` should cover:

- Project overview and purpose
- Key features
- Technology stack
- Project structure
- Prerequisites
- Installation/setup
- Environment variables
- Running the project
- Building the project
- Testing and linting
- Usage instructions
- API information
- Database setup
- Deployment
- Important limitations
- Examples
- Contribution/development instructions

Do not add unnecessary implementation details that belong in `.context/` or the source code.

---

## 8. Final Report

After completing the task, provide a concise summary containing:

- What was implemented.
- Files/components changed.
- Verification performed and its result.
- Documentation/context updates made.
- Any known limitations, unresolved issues, or follow-up work.

Do not claim that something was tested, verified, or completed if it was not actually done.
