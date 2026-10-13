# AGENTS.md — Gains

## Project Overview

Gains is a full-stack fitness tracking app.

* **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Zustand
* **Backend:** FastAPI, SQLAlchemy 2.0, Pydantic, Alembic
* **Database:** SQLite (development), PostgreSQL (production)
* **Auth:** JWT + bcrypt

## Project Structure

```text
backend/
├── app/
│   ├── main.py
│   ├── database.py
│   ├── models/
│   ├── schemas/
│   ├── routers/
│   ├── services/
│   └── workers/
├── alembic/
└── requirements.txt

frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # Shared UI
│   ├── features/            # Feature-specific code
│   ├── lib/                 # Shared utilities
│   └── middleware.ts
├── package.json
└── tsconfig.json
```

## Backend Conventions

### Models

* Use `Base` + `AuditMixin`.
* Use SQLAlchemy 2.0 `Mapped` / `mapped_column`.
* Use foreign keys with appropriate `ondelete` behaviour.
* Add indexes to frequently queried fields.
* Add new models to `app/models/__init__.py`.

### Schemas

* Use Pydantic schemas from `app/schemas/base.py`.
* Use the project's camelCase alias conversion.
* Separate Create, Update and Response schemas where appropriate.
* Use validators for complex validation.

### Services

* Business logic belongs in `services/`, not routers.
* Use SQLAlchemy 2.0 `select()` — never the legacy Query API.
* Roll back failed database writes.
* Use eager loading such as `selectinload` where appropriate.

### Routers

* Use dependency injection for authentication and database access.
* Use `Annotated` dependencies.
* Return appropriate HTTP status codes.
* Keep routers thin; delegate logic to services.

### Migrations

After model changes:

```bash
alembic revision --autogenerate -m "description"
alembic upgrade head
```

Always review generated migrations before committing.

## Frontend Conventions

### Next.js

* Use the App Router and existing route groups.
* **Next.js 16 has breaking changes:** check the installed Next.js documentation before using unfamiliar APIs.
* Prefer Server Components; use `"use client"` only when required.
* Use `Link` for navigation.

### TypeScript

* Strict mode is enabled.
* Never use `any` when a proper type can be defined.
* Keep feature-specific types in `types.ts`.
* Use the `@/*` path alias.

### Features

New functionality should follow the existing feature structure:

```text
src/features/<feature>/
├── actions.ts
├── schema.ts
├── types.ts
├── store.ts       # if needed
├── queries.ts     # if needed
└── utils.ts       # if needed
```

Do not create new architectural patterns without a good reason.

### API

* Use the configured Axios instance in `src/lib/axios.ts`.
* Use server actions for mutations.
* Use existing error handling (`handleApiError`).
* Properly type API requests and responses.

### Validation

* Use Yup schemas in `schema.ts`.
* Infer TypeScript types from Yup schemas where possible.
* Validate important data on both frontend and backend.

### Styling

* Use Tailwind CSS v4 and existing design tokens.
* Do not hardcode colours when a design token exists.
* Follow existing shadcn/ui and component patterns.
* Ensure new UI works responsively.

### State

* Use Zustand for shared/persistent client state.
* Keep stores strongly typed.
* Avoid global state when local component state is sufficient.

## Rules for Agents

### Always

* Read existing code before implementing changes.
* Follow established architecture and naming conventions.
* Reuse existing utilities and components.
* Keep business logic in services.
* Use proper TypeScript/Python typing.
* Handle errors consistently.
* Run relevant tests, linting and builds before finishing.
* Use environment variables for secrets.
* Review migrations before committing.

### Never

* Use SQLAlchemy's legacy Query API.
* Put business logic in routers.
* Skip migrations after model changes.
* Commit `.env` files, secrets or credentials.
* Use `any` unnecessarily.
* Bypass the configured Axios instance.
* Hardcode colours instead of using design tokens.
* Modify `node_modules`.
* Commit build artifacts.
* Ignore existing TypeScript or lint errors.
* Introduce unnecessary architectural changes.

## Development Workflow

### Backend

1. Update models.
2. Update `app/models/__init__.py` if needed.
3. Generate and review migration.
4. Apply migration.
5. Update schemas.
6. Implement service logic.
7. Add/update router.
8. Register router in `main.py`.
9. Test the changes.

### Frontend

1. Check Next.js 16 documentation for unfamiliar APIs.
2. Add/update feature code.
3. Define types and validation.
4. Implement actions/queries.
5. Add state management only if needed.
6. Build UI using existing components and design tokens.
7. Test functionality and responsiveness.

## Commands

### Backend

```bash
cd backend
alembic upgrade head
./start.sh
```

Or:

```bash
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
npm run lint
npm start
```

## Environment

### Backend

* `DATABASE_URL`
* `SECRET_KEY`
* `ALGORITHM`
* `FRONTEND_ORIGIN`
* `DB_CA_CERT_PATH` (PostgreSQL)

### Frontend

* `NEXT_PUBLIC_BASE_URL`
* `BASE_URL`

Never commit `.env` files.

## Important Patterns

### Authentication

Frontend → auth endpoint → JWT → httpOnly cookie → Axios interceptor → `get_current_user` dependency.

### Data Flow

* **GET:** client-side queries/components
* **POST/PUT/DELETE:** server actions
* **Global persistent state:** Zustand

### Error Handling

* **Backend:** appropriate `HTTPException` status codes.
* **Frontend:** `handleApiError` + existing toast notification patterns.

## Final Principle

**Prefer consistency over cleverness.** Before adding a new pattern, check how the existing code solves the same problem and follow it unless there is a clear reason not to.
