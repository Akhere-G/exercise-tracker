# L11. PWA plugin may be inert under Turbopack (unverified)

> **Status:** Proposed (investigation) · **Severity:** Low · **Type:** Assumption to verify · **Confidence:** Potential · **Effort:** S
> Finding: [`docs/audit/findings.md`](../../audit/findings.md#l11-pwa-plugin-may-be-inert-under-turbopack-unverified)

## Problem
`frontend/next.config.ts` wraps the config with `@ducanh2912/next-pwa` (`cacheOnFrontEndNav`, `aggressiveFrontEndNavCaching`, `reloadOnOnline`, `dest: "public"`) and also sets `turbopack: {}`. `next-pwa` is a webpack plugin; Next 16 builds with Turbopack by default, in which case the plugin's service worker generation is likely skipped. The committed `frontend/public/sw.js` (641 bytes, last modified Sep 1) is the hand-written push-notification worker used by `features/notifications/utils.ts` (`navigator.serviceWorker.register("/sw.js")`). I did not run a build, so I could not confirm either way.

Why it matters: if the plugin does run, (a) it may overwrite `public/sw.js` with a generated Workbox file and break push handling, and (b) aggressive navigation caching could keep authenticated pages in the browser cache after logout. If it does not run, the config is dead code and `next-pwa` is an unnecessary dependency carrying the vulnerable transitive packages listed in [H3](H3-vulnerable-dependencies.md).

## Goal
Know what the PWA setup actually does and make the configuration match.

## Non-goals
Building a full offline experience.

## Proposed change
1. Run `npm run build` in a scratch copy (or CI) and inspect the output: is `public/sw.js` changed or is `workbox-*.js` generated? Check `git status` afterwards.
2. If inert: remove `@ducanh2912/next-pwa` and the wrapper; keep `manifest.json` and the manual `sw.js` (add a `Cache-Control: no-cache` header for `/sw.js`).
3. If active: set a `customWorkerSrc` to include the push handlers in the generated worker, exclude authenticated routes from navigation caching, and clear caches on logout.

## Acceptance criteria
- A documented answer (in this spec) on whether the plugin runs.
- Push notifications still work after the change; nothing authenticated is served from cache after logout.

## Test plan
Build and inspect; in the Browser pane check Application -> Service Workers and Cache Storage before and after logout.

## Risks / rollout
Low if inert; moderate if active (service worker updates are sticky in users' browsers).

## Dependencies
Related: [H3](H3-vulnerable-dependencies.md).
