# L9. Blank toast on form validation errors

> **Status:** Proposed · **Severity:** Low · **Type:** Bug / UX · **Confidence:** Confirmed · **Effort:** S
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#l9-blank-toast-on-form-validation-errors)

## Problem
`ActionResponse` (`frontend/src/lib/apiTypes.ts`) has `error?: string` for unexpected errors and `errors?: ValidationError[]` for API errors. `handleApiError` puts the backend `detail` into `errors`, which for HTTPException responses is a **string**, and for FastAPI validation errors an **array**; the type only admits an array. Callers such as `WorkoutForm.tsx:194` (`toast.error(response.error)`) and `WorkoutClientProvider.tsx` read `error`, which is `undefined` for API failures, so the user sees an empty or generic toast (for example the demo quota 403 message "Demo accounts are limited in size..." is never shown). `getFailureReason` in `features/analytics/utils.ts` already handles both shapes.

## Goal
Every failed action shows a meaningful message.

## Non-goals
Redesigning the toast system.

## Proposed change
- Normalise in `handleApiError`: always return `{ success: false, error: string, errors?: ValidationError[] }` where `error` is the string `detail`, the first validation message, or a friendly fallback ("Something went wrong").
- Type `errors` as `string | ValidationError[]` or drop it in favour of `error` plus `fieldErrors`.
- Add a small helper (for example `getErrorMessage(response)` in `lib/componentUtils.ts` or `apiTypes.ts`) and use it for toasts in `WorkoutForm.tsx`, `WorkoutClientProvider.tsx`, routine forms and auth forms; where forms support field errors, map `loc` to field names.
- Use `err.response?.data?.detail` (optional chaining on `data`) for network errors and non-JSON bodies.

## Acceptance criteria
- Triggering the demo quota or a validation error shows its message in the toast.
- Stopping the backend shows a "could not reach server" message.

## Test plan
Manual; unit test for `getErrorMessage` if a test runner is added.

## Risks / rollout
Low; touch each caller in one PR so the shape change is consistent.

## Dependencies
Related to [L2](L2-auth-redirects-and-proxy.md) (same helper).
