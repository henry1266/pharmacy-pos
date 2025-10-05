# Products Contract Migration Release Log

## SemVer Decision

| Category | Assessment |
| --- | --- |
| Breaking change | No - envelope parity preserved and new ts-rest contract is gated behind `FEATURE_PRODUCTS_CONTRACT`. |
| Release impact | Recommend **minor** bump once the new router is enabled in production. |
| SSOT alignment | Shared Zod schemas and OpenAPI contract already in sync; generated SDK will be versioned with the minor release. |
| Follow-up | Coordinate backend/frontend package bumps and SDK publication after Tech Lead HITL approval. |

## Feature Flag & Fallback Strategy

- `FEATURE_PRODUCTS_CONTRACT` controls whether the ts-rest router is mounted under `/api` or the legacy Express router stays in place.
- Default configuration keeps the flag **false**, guaranteeing traffic continues to use the legacy endpoints until rollout evidence is signed off.
- Canary rollout = enable the flag on staging / limited production nodes, validate contract tests + POS smoke suite, then widen blast radius.
- Immediate fallback = toggle the flag back to `false` and redeploy; no data migrations are required because storage schemas are unchanged.
- Keep contract regression tests (see below) in CI to detect envelope or schema drift before flag flips.
- HITL checkpoint: Tech Lead must confirm envelope parity dashboards before enabling in production.

## Rollout Checklist

1. Merge SSOT artifacts, contract handlers, and this release note into main.
2. Deploy with `FEATURE_PRODUCTS_CONTRACT=false`; capture baseline latency/error metrics for legacy routes.
3. Enable the flag in staging and execute `pnpm --filter backend test -- products.contract.test.ts` plus frontend smoke flows.
4. Promote to a production canary (single POS site) for 48 hours with monitoring on HTTP 4xx/5xx deltas.
5. After successful canary, enable the flag fleet-wide and schedule Phase 4 cleanup of legacy routes.

## Observability & Monitoring

- Track product create/update/delete success rates split by feature flag via structured logs (`success`, `statusCode`).
- Alert on sustained (>5 min) increases of 4xx/5xx when the flag is true; fallback by disabling the flag.
- Retain request/response envelope snapshots for parity verification (stored in existing contract tests snapshots).

## Test Evidence

| Suite | Command | Notes |
| --- | --- | --- |
| Backend contract regression | `pnpm --filter backend test -- products.contract.test.ts` | Validates SSOT envelopes for create/update/delete, duplicates, invalid payloads, and 404 flows under the feature flag. |
| Shared schema compilation | `pnpm --filter shared type-check` | Ensures the shared Zod schemas used by the contract remain consistent. |

## Risk Register Snapshot

| Type | Description | Mitigation |
| --- | --- | --- |
| data | Contract drift between backend envelopes and SSOT schemas. | Zod-driven contract tests + shared fixtures enforce parity. |
| perf | Additional adapter logic may add latency during rollout. | Monitor P95 latency per flag state; revert via feature flag if regression >10%. |
| security | Misconfigured flag accidentally exposes incomplete handlers. | Default `false`, documented rollout checklist, and HITL approval before enabling in production. |

## References

- `frontend/src/features/product/README.md`
- `backend/modules/products/__tests__/products.contract.test.ts`
- `shared/testing/products`
