# tabit - Agent Guidelines

tabit is a React 18 web application - a drum machine and drum tablature viewer for drum crews. It is a purely static frontend (no backend). It deploys to GitHub Pages.

---

## Git Interactions

- NEVER commit, rebase, or merge without explicit human approval
- NEVER push
- NEVER run `yarn deploy` - this publishes to GitHub Pages and requires explicit approval
- Always run quality gates before suggesting a commit
- Present what changed and why before committing

## Dependencies

- Use `yarn` - do not use `npm` or `npx` directly
- Do not run `yarn install` or `yarn add` without approval

## Quality Gates

Run these without waiting for explicit approval:

```bash
yarn test --watchAll=false
yarn build
```

Both must pass before suggesting a commit.

## Dev Server

```bash
yarn start
```

Runs on `http://localhost:3000` with hot reload.

## Testing

- Tests live in `src/__tests__/` and use Jest with React Testing Library
- Some tests use Jest snapshots - only update snapshots with explicit human approval (`yarn test --watchAll=false -u`)
- The Python scripts in `/scripts/` are for managing test data only - not part of normal dev workflow

## Code Style

- This is a JavaScript project - not TypeScript. Do not add type annotations or suggest a TS migration
- Match the existing style and conventions in the codebase wherever possible
- No empty catch blocks - handle the error or explain why not
- Prefer `-` (hyphen) over `--` (em dash) in all files
- Avoid non-ASCII characters in text files

## Architecture

- `src/` - all application source
  - `src/data/` - core business logic (notation, track models, Hydrogen parser)
  - `src/__tests__/` - test suites
  - `src/PatternDisplay/` - pattern rendering components
  - `src/instrumentConfig/` - drum kit configuration UI
  - `src/common/` - reusable dialog components
- `public/wav/` - WAV audio samples
- `test_data/` - fixture files for import tests

## General Principles

- Prefer simple solutions as a starting point
- Readable code over clever code
- Don't add features, refactor, or introduce abstractions beyond what the task requires
- No comments unless the "why" is non-obvious
- When stuck, present options with trade-offs and a recommendation - don't just pick one
- Ask clarifying questions before making assumptions

## Communication

- When asked about the state of something (tests, build, errors), describe what you observe before jumping to fixes
- Be direct and honest about limitations and trade-offs
- Warn if a solution is overcomplicating things
