# Claude Code Instructions — Asteroid Prospecting Atlas

## 1. Test-Driven Development (TDD) — NON-NEGOTIABLE

**Write the failing test first. Always. No exceptions.**

Before implementing any feature, endpoint, utility function, or data transformation:

1. Write a failing test that describes the expected behavior
2. Confirm it fails for the right reason
3. Write the minimum code to make it pass
4. Refactor if needed, keeping tests green

This applies to every task, no matter how small. If asked to implement something without a test, stop and write the test first. Remind the user of this if they ask to skip it.

This project achieved 100% test coverage. We are keeping it that way.

---

## 2. Architecture

- Backend: Python / FastAPI / PostgreSQL / SQLAlchemy
- Frontend: React 18 + TypeScript / CesiumJS / Resium / Vite (port 5173)
- API runs on port 8000; frontend expects it there via `useAsteroids.ts`
- Never push directly to `main`

---

## 3. Code Style

- Ruff for linting and formatting (backend)
- TypeScript strict mode (frontend)
- No comments unless the WHY is non-obvious
- No speculative abstractions — solve the problem in front of you
