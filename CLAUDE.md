# CLAUDE.md

## Source of truth
- `DESIGN_SPEC.md` is the source of truth for product decisions. Read it before starting any task.
- When a decision changes, update the spec in the same change. Don't let code and spec drift.
- Build only the current phase (spec §11). Don't add features from later phases or §10 unless asked.

## How to work
- **Diagnose before changing.** Investigate precisely and state the cause before proposing a fix. No speculative fixes.
- **Environment problems are not code problems.** If something fails because of configuration, keys, network or device settings, verify the environment first and do not modify code to work around it.
- Read the relevant source files before drawing conclusions. Don't guess.
- Never re-apply a change that was previously rejected.
- Ask before adding a new dependency.

## Web UI rule
- The only app is the host app, which is React Native; do not propose alternatives. Players and the TV use web pages in a browser, not an app, and those pages are Preact. Never write vanilla-JS UI (DOM manipulation, `innerHTML`, imperative widgets), not even in spikes.
- Follow spec §2.2: component-based architecture planned before coding, shared components across player and TV views, a single state store, design tokens as CSS custom properties for every color, type and spacing value, and scoped component styles. Hard-coded colors or ad-hoc styles are defects.

## Product rule
- Every change is judged against the usability benchmark in spec §1. If a change makes the first-time host or player experience harder, raise it before building it.
