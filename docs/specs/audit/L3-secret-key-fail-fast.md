# L3. `SECRET_KEY` and `ALGORITHM` default to empty strings

> **Status:** Proposed · **Severity:** Low · **Type:** Security (fail-open configuration) · **Confidence:** Confirmed · **Effort:** S
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#l3-secret_key-algorithm-default-to-empty-strings)

## Problem
`backend/app/services/user.py:17-18`: `SECRET_KEY = os.getenv("SECRET_KEY", "")`, `ALGORITHM = os.getenv("ALGORITHM", "")`. If `SECRET_KEY` is missing in an environment, PyJWT signs and verifies tokens with an empty key (anyone can forge tokens); a missing or mistyped `ALGORITHM` fails at first login with an obscure error. Decoding uses `algorithms=[ALGORITHM]`, so a mis-set value such as `none` would be dangerous. Tests use an 11-byte key and PyJWT warns (`InsecureKeyLengthWarning`). The local `.env` has a 64-character `SECRET_KEY` and a 5-character `ALGORITHM` (values not reproduced here).

## Goal
The API refuses to start with a missing, short or unsupported signing configuration.

## Non-goals
Key rotation or asymmetric keys.

## Proposed change
- Add a small settings module (for example `app/config.py`, using the already-installed `pydantic-settings`) that reads `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `FRONTEND_ORIGIN`, `DEMO_MODE_ENABLED`, `DATABASE_URL`; validate `len(SECRET_KEY) >= 32` and `ALGORITHM in {"HS256", "HS384", "HS512"}`; raise at import/startup.
- Use it in `services/user.py`, `database.py`, `main.py` and the worker; update `tests/conftest.py` to use a 32+ character test key (removes the warning).
- Keep behaviour of `load_dotenv()` for local use; document variables in `backend/.env.example`.

## Acceptance criteria
- Starting the app without `SECRET_KEY` (or with a short one) exits with a clear message.
- `pytest` passes with no `InsecureKeyLengthWarning`.
- Production starts with its existing environment (verify the Cloud Run values meet the rule before deploy).

## Test plan
Unit test for the settings validator; run the suite.

## Risks / rollout
A production secret shorter than 32 characters would block startup; check the deployed value first (do not print it).

## Dependencies
Group with [H4](H4-auth-rate-limiting.md). Related: [L1](L1-production-url-fallback.md) (env examples).
