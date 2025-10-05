# ADR 2025-10-05: Products Contract Migration Alignment

- **Status:** Proposed
- **Driver:** Codex AI agent (on behalf of team)
- **Reviewers:** TBD
- **Related work:** README – *Products Module ts-rest Migration Plan*

## Context

The legacy ackend/routes/products.ts Express router exposes a large surface area (11 endpoints) that returns ad-hoc envelopes ({ success, message, data, timestamp, ... }) and manipulates related resources such as package units. Frontend code mixes two access patterns: a shared ProductApiClient (axios-based) and ad-hoc axios calls (e.g. filtered list). To adopt the established SSOT workflow (Zod + ts-rest + OpenAPI) we need a scoped, phase-driven migration that keeps existing behaviour working during rollout.

## Current Endpoint Inventory

| HTTP | Path | Notes |
| ---- | ---- | ----- |
| GET | /api/products | Filtered list with search, productType, category, supplier, min/max price, stockStatus, sort, returns ilters + count. |
| GET | /api/products/products | Convenience list of non-medicine products. |
| GET | /api/products/medicines | Convenience list of medicine products. |
| GET | /api/products/code/:code | Lookup by code, 404 handling. |
| GET | /api/products/:id | Detail fetch with populated category/supplier. |
| POST | /api/products/product | Create non-medicine; auto-code generation, package-unit persistence. |
| POST | /api/products/medicine | Create medicine; health-insurance logic, package units. |
| PUT | /api/products/:id | Update product; validates unique code, toggles productType based on healthInsuranceCode, updates package units. |
| DELETE | /api/products/:id | Soft delete (sets isActive=false). |
| PUT | /api/products/:id/package-units | Update package units directly (used by UI); requires PackageUnitService. |
| POST | /api/products/create-test-data | Test helper to seed sample data. |

Package-unit helpers also rely on ackend/services/PackageUnitService and ackend/models/ProductPackageUnit.

## Envelope & Error Shape

- Successful responses typically return { success: true, message, data?, timestamp, ... }; list APIs add ilters and count.
- Error responses use { success: false, message, error?, timestamp, statusCode? }; validation errors include details or express-validator array.
- Status codes: 200/201 for success, 400/404/409/500 depending on validation, not-found, duplication, internal errors.

Any contract must either preserve these envelopes or provide a compatibility layer.

## Known Consumers

- shared/services/productApiClient.ts (used by some services/tests).  
- rontend/src/services/productServiceV2.ts (newer service mixing contract client ideas).  
- Numerous frontend screens/pages under rontend/src/features/product, package-units, csv import, etc., rely on the envelopes above.
- Backend tests under ackend/routes/__tests__/products*.test.ts assert current routes and payloads. Package unit tests use /api/products/:id/package-units.

## Assumptions & Decisions

1. **Compatibility first:** Phase 1–3 will keep legacy envelopes so frontend does not break mid-migration.
2. **Coverage:** Initial ts-rest contract will include the 10 production endpoints. The /create-test-data helper remains legacy (optional future migration).
3. **Package units:** Contract will re-use existing PackageUnitService to avoid performance regressions.
4. **Soft delete:** DELETE semantics stay as “set isActive=false”.
5. **Validation:** Express-validator rules will be translated into Zod for create/update; additional runtime guards remain in the service.

## Open Questions / Requests for Feedback

- Should /api/products/:id/package-units be part of the same contract router or broken into a separate package-unit contract?
- Do we need to support pagination metadata in responses (current list endpoint returns ilters + count but no explicit pagination object)?
- Confirm whether ProductApiClient (shared) is still required after migration or can be deprecated.
- Strategy for /create-test-data: keep as separate legacy route or reimplement as ts-rest (flagged low priority).

## Next Steps (Phase 1 Entry Criteria)

- Confirm answers to open questions with product/backend owners.
- Draft Zod schemas for product DTOs, query params, and package-unit payloads under shared/schemas/zod/product.ts.
- Define productsContract in shared/api/contracts/ and ensure exports/clients mirror employees/suppliers patterns.
- Update README roadmap once feedback is incorporated.

---

Document owner: Codex AI (pending hand-off once a human lead is assigned).
