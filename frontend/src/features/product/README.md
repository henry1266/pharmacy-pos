# Products Module ts-rest Migration Plan

## Status Snapshot

| Phase | State | Last Update | Notes |
| ----- | ----- | ----------- | ----- |
| Phase 0 - Alignment & Scope | Done | 2025-10-05 | ADR recorded, endpoint inventory confirmed. |
| Phase 1 - Shared SSOT Foundations | In progress | 2025-10-05 | Zod schemas and products contract drafted; awaiting SSOT review and OpenAPI sync. |
| Phase 2 - Backend Module | In progress | 2025-10-05 | Read/write endpoints migrated into ts-rest service; envelope adapter pending. |
| Phase 3 - Frontend Integration | Not started | N/A | Work begins after backend exposes ts-rest router. |
| Phase 4 - Migration & Cleanup | Not started | N/A | Requires production confidence and monitoring hooks. |
| Phase 5 - Hardening & Extras | Not started | N/A | Schedule once contract adoption stabilises. |

## Phase Breakdown

### Phase 0 - Alignment & Scope

- Exit criteria: mission, constraints, and envelope expectations captured in ADR with reviewer sign-off.
- Delivered: `docs/adr/2025-10-05-products-contract-migration-alignment.md`, endpoint matrix, compatibility assumptions.
- Follow-ups: resolve open questions in ADR before backend cutover.
- Task checklist:
  - [x] Record migration ADR and circulate for review.
  - [x] Catalogue legacy routes, envelopes, and consumers.
  - [ ] Secure HITL answers on package-unit routing, pagination metadata, and ProductApiClient deprecation.

### Phase 1 - Shared SSOT Foundations

- Exit criteria: product schemas and contracts live under `shared/` and `openapi/`, parity reviewed against legacy responses, generated clients published.
- Owners: Schema Steward (primary), API Contract Enforcer (review).
- Dependencies: ADR decisions, upstream package-unit schema, ts-rest tooling.
- Task checklist:
  - [x] Draft `shared/schemas/zod/product.ts` covering DTOs, queries, package units.
  - [x] Draft `shared/api/contracts/products.ts` with envelope-preserving responses.
  - [x] Update OpenAPI paths/components to match `productsContract` (generate ts-rest bindings and SDKs).
  - [x] Wire `productsContract` into `shared/api/contracts/index.ts` router once compatibility is confirmed.
  - [x] Publish valid/invalid payload fixtures for contract tests (`shared/testing/products`).
  - [ ] Decide SemVer impact and note in release staging log.

### Phase 2 - Backend Module

- Exit criteria: `backend/modules/products` exposes ts-rest router mirroring legacy behaviour, envelopes remain backward compatible, automated tests pass.
- Owners: Backend Orchestrator with API Contract Enforcer support.
- Task checklist:
  - [x] Scaffold ts-rest router and controllers under `backend/modules/products` (initial handlers return 501 until legacy logic is ported).
  - [x] Refactor legacy service to orchestrator/services split with package-unit reuse (create/update/delete migrated from legacy router).
  - [x] Port read endpoints (list + detail) into `backend/modules/products/products.service.ts` leveraging package-unit helpers.
  - [x] Wire feature flag `FEATURE_PRODUCTS_CONTRACT` to gate ts-rest router rollout (default off).
  - [ ] Introduce envelope adapter to maintain `{ success, message, data }` shape.
  - [ ] Add contract tests and regression suites to cover create/update/delete flows.
  - [ ] Document fallback/feature flag strategy for rollout.

### Phase 3 - Frontend Integration

- Exit criteria: frontend queries rely on generated SDK, no direct axios usage, form validation aligns with shared schemas.
- Owners: Frontend Builder.
- Task checklist:
  - [ ] Replace `ProductApiClient` usages with generated ts-rest client.
  - [ ] Update RTK Query slices and hooks to honour new envelope helpers.
  - [ ] Align forms and table views with shared validators (no duplicate Zod definitions).
  - [ ] Add UI regression tests for list/detail/create/update flows.

### Phase 4 - Migration & Cleanup

- Exit criteria: legacy Express routes retired or aliased, documentation and monitoring updated, rollback plan rehearsed.
- Task checklist:
  - [ ] Configure traffic cutover and feature flag strategy.
  - [ ] Remove redundant axios services after confidence window.
  - [ ] Update runbooks, onboarding docs, and changelog entries.
  - [ ] Produce rollback playbook referencing legacy routes.

### Phase 5 - Hardening & Extras

- Exit criteria: coverage >= 80% on key paths, performance + observability baselines documented, post-cutover tasks closed.
- Task checklist:
  - [ ] Expand contract/E2E suites with edge cases (pagination, soft deletes, package units).
  - [ ] Benchmark hot endpoints and note thresholds in monitoring dashboard.
  - [ ] Finalise CHANGELOG, SemVer release, and monitoring alerts.

## Cross-cutting Dependencies

- Runtime flag `FEATURE_PRODUCTS_CONTRACT` controls router swap; keep false until envelope adapter + tests land.

- `shared/` remains the SSOT for DTOs, validators, and contract exports.
- `openapi/paths/products.json` must be regenerated to reflect ts-rest contract; ensure SemVer notes accompany breaking fields.
- Generated SDKs consumed by frontend/backoffice need version bump coordination.
- Legacy database models (`backend/models/Product`, `ProductPackageUnit`) stay authoritative until migrations land.

## Risk Register

| Risk | Impact | Mitigation | Owner |
| ---- | ------ | ---------- | ----- |
| Envelope drift between legacy responses and ts-rest contract | Medium | Add contract regression tests comparing fixtures to legacy snapshots before enabling router. | API Contract Enforcer |
| Package unit mutation semantics regress during refactor | High | Preserve existing service layer, add integration tests around `/:id/package-units`. | Backend Orchestrator |
| Frontend feature drift due to staggered rollout | Medium | Provide typed compatibility helpers and staged feature flags per view. | Frontend Builder |
| Forgetting SemVer + change log updates | Low | Track in Release Manager checklist prior to merge. | Release Manager |

## Verification Plan

| Area | Tests | Notes |
| ---- | ----- | ----- |
| Shared schemas | Zod parity tests vs legacy fixtures; lint/tsc | Run before publishing contract package. |
| Backend | ts-rest contract tests, service unit tests, supertest regression suite | Gate router rollout behind CI green + envelope diff. |
| Frontend | RTK Query contract mocks, Cypress smoke on product flows | Execute during feature flag canary. |
| Observability | Pino structured logs, traceId propagation checks | Verify under load test before legacy removal. |

## References

- ts-rest router scaffold: `../../../../backend/modules/products/products.routes.ts`
- Service layer port (read operations): `../../../../backend/modules/products/products.service.ts`
- ADR: `../../../../docs/adr/2025-10-05-products-contract-migration-alignment.md`
- Legacy router for comparison: `../../../../backend/routes/products.ts`
- Current product service usages: `../` UI modules and `../../services/productServiceV2.ts`

## Workstream Ownership

| Phase | Primary Agent Role | Named Owner(s) | HITL Reviewer | Notes |
| ----- | ------------------ | -------------- | ------------- | ----- |
| Phase 0 | Schema Steward | Codex (handover pending) | Product Lead | Completed; awaiting responses to open questions. |
| Phase 1 | Schema Steward + API Contract Enforcer | Backend Guild | Architecture Council | Requires SSOT sign-off and OpenAPI regeneration. |
| Phase 2 | Backend Orchestrator | Services Team | Tech Lead | Read/write endpoints live in module; plan alpha rollout behind `products-contract` flag once envelope adapter lands. |
| Phase 3 | Frontend Builder | Web Platform Squad | UX Lead | Coordinate canary release with POS frontline team. |
| Phase 4 | Migrator + Release Manager | Platform Ops | CTO Delegate | Needs rollback rehearsal and comms plan. |
| Phase 5 | Testwright + Sec & Compliance Auditor | Quality Guild | Compliance Officer | Include post-mortem review of monitoring coverage. |

## Upcoming Milestones

| Milestone | Target Date | Blocking Dependencies | Exit Evidence |
| --------- | ----------- | --------------------- | ------------- |
| Resolve ADR open questions | 2025-10-07 | HITL answers for package-unit scope, pagination, client deprecation | ADR updated with decisions + reviewer approval. |
| Publish SSOT artifacts | 2025-10-09 | OpenAPI path regeneration, schema parity tests | Versioned `openapi/paths/products.json` diff + schema test report. |
| Backend ts-rest alpha ready | 2025-10-16 | Phase 1 exit, feature flag scaffolding, regression suite | CI passes for new module, envelope snapshot tests, rollout checklist. |
| Frontend switch for canary POS site | 2025-10-24 | Backend alpha deployed, SDK versioned release | Canary feedback doc + UI regression report. |
| Legacy route retirement vote | 2025-11-07 | Metrics stable, no Sev-1 incidents in 2 weeks | Change log entry, rollback plan archived, release sign-off. |

## Artifact Tracker

| Artifact | Location | Owner | Status | Notes |
| -------- | -------- | ----- | ------ | ----- |
| Migration ADR | `docs/adr/2025-10-05-products-contract-migration-alignment.md` | Schema Steward | Done | Pending updates after HITL feedback. |
| Zod schemas | `shared/schemas/zod/product.ts` | Schema Steward | In review | Requires validation fixtures + parity tests. |
| ts-rest contract | `shared/api/contracts/products.ts` | API Contract Enforcer | In review | Integrated into shared router; pending backend handler scaffolding. |
| OpenAPI spec | `openapi/paths/products.json` | Schema Steward | Updated | Regenerated from shared contract (2025-10-05). |
| Backend module | `backend/modules/products` | Backend Orchestrator | In progress | Read/write flows migrated to ts-rest service; envelope adapter + rollout plan pending. |
| Frontend integration guide | `frontend/src/features/product/README.md` | Frontend Builder | In progress | Update as canary learnings arrive. |
| Test matrix | `shared/testing/products` | Testwright | Seeded | Valid/invalid payload fixtures published; coverage dashboard pending. |
| Release log | `docs/release-notes/products-contract.md` (planned) | Release Manager | Not started | Capture SemVer decision + rollout instructions. |

## HITL Checkpoints & Escalation

- Phase 1 exit requires Architecture Council sign-off on SSOT parity and compatibility fixtures.
- Phase 2 deployment must be manually approved by Tech Lead after reviewing regression and contract test evidence.
- Phase 3 canary rollout needs UX Lead and frontline POS representative confirmation before expanding blast radius.
- Phase 4 legacy retirement hinges on CTO Delegate approval following rollback drill results.

## Communication Plan

- Stand-up sync: dedicated agenda item every Tuesday until Phase 4 completes.
- Async updates: post status snapshot deltas in `#proj-products-contract-migration` Slack channel by end of day Thursday.
- Decision logging: append key decisions to the ADR and link from this README under References.
- Incident handling: route Sev-2+ issues through on-call playbook, referencing this migration as the change context.
