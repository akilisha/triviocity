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

## Product rule
- Every change is judged against the usability benchmark in spec §1. If a change makes the first-time host or player experience harder, raise it before building it.
