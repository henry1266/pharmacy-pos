# Suppliers Module (Backend)

> Backend implementation for supplier management using the ts-rest contract generated from `shared/api/contracts/suppliers.ts`. The structure mirrors `backend/modules/sales` so every responsibility has a predictable home and new contributors can cross-reference the sales module as a working template.

## Responsibilities
- Serve `/api/suppliers` endpoints via ts-rest with consistent success/error envelopes.
- Validate, normalise, and persist supplier data using the shared Zod schemas as the SSOT.
- Generate stable supplier codes/short codes and enforce uniqueness guarantees.
- Provide query helpers (search, sort, pagination) that can be unit tested without hitting the database.

## SSOT & Cross-Module Dependencies

| Item | Source | Notes |
| --- | --- | --- |
| Zod schemas | `shared/schemas/zod/supplier.ts` | `supplierEntitySchema`, `createSupplierInput`, `updateSupplierInput`, `supplierSearchInput` |
| ts-rest contract | `shared/api/contracts/suppliers.ts` | Defines REST surface used by router + client SDKs |
| Utilities | `@pharmacy-pos/shared/constants` | HTTP status codes, success/error messages |
| Mongoose model | `backend/models/Supplier.ts` | Persistence layer used by orchestration services |

## Layered Structure

| Path | Role | Notes |
| --- | --- | --- |
| `suppliers.routes.ts` | ts-rest router bridge | Converts contract methods to Express handlers, delegates business logic to service orchestrators, maps errors to HTTP responses |
| `suppliers.service.ts` | Orchestrator | Coordinates validation, query prep, code generation, and persistence; raises `SupplierServiceError` for the router |
| `services/query.service.ts` | Query helpers | Builds filter/sort/pagination objects; covered by unit tests in `services/__tests__/` |
| `services/code.service.ts` | Code generation | Ensures supplier codes are unique, derives short codes |
| `services/persistence.service.ts` | Data access | Wraps Mongoose operations for listing, reading, creating, updating, deleting suppliers |
| `services/validation.service.ts` | Sanitisation | Normalises incoming payloads and string fields before persistence |
| `middlewares/*` | Express middlewares | Request-level validation/parsing for params and query strings |
| `utils/*` | Shared helpers | Response mapping, string helpers, and short code utilities exported via the local barrel |
| `suppliers.types.ts` | Type aliases | Aligns backend types with shared Zod contracts |

## API Summary

| Method | Path | Contract Key | Service Call | Description |
| --- | --- | --- | --- | --- |
| GET | `/api/suppliers` | `suppliers.listSuppliers` | `suppliersService.listSuppliers` | Search, sort, filter, and paginate suppliers |
| GET | `/api/suppliers/:id` | `suppliers.getSupplierById` | `suppliersService.findSupplierById` | Retrieve a single supplier by id |
| POST | `/api/suppliers` | `suppliers.createSupplier` | `suppliersService.createSupplier` | Create a supplier, auto-generating code/short code as needed |
| PUT | `/api/suppliers/:id` | `suppliers.updateSupplier` | `suppliersService.updateSupplier` | Update supplier fields while enforcing code uniqueness |
| DELETE | `/api/suppliers/:id` | `suppliers.deleteSupplier` | `suppliersService.deleteSupplier` | Soft delete equivalent (removes document) |

All responses use the shared success/error envelope helpers exported from `utils/response.ts`.

## Core Flows

### List suppliers (`GET /api/suppliers`)
1. Router validates query params with middleware.
2. `suppliers.service.listSuppliers` calls `buildSupplierListQuery`.
3. `persistence.fetchSuppliers` executes the query and returns lean documents.
4. Router maps the records through `transformSupplierToResponse` before responding.

### Create supplier (`POST /api/suppliers`)
1. Router validates payload (Zod + middleware).
2. Service normalises the supplier name; missing name results in `400`.
3. `validation.buildSupplierFields` sanitises strings, `code.service` enforces/creates supplier codes and short codes.
4. `persistence.createSupplierDocument` inserts the document and returns a plain object.

### Update supplier (`PUT /api/suppliers/:id`)
1. Router validates params/body and ensures the supplier exists.
2. Service sanitises incoming values and checks for code conflicts.
3. Short code recalculates when the name changes and no explicit short code is provided.
4. `persistence.updateSupplierDocument` performs the update with validators on.

### Delete supplier (`DELETE /api/suppliers/:id`)
1. Router validates params.
2. Service delegates to `persistence.deleteSupplierDocument`; returns `404` when the document is absent.

## Verification & Tooling

```bash
# Type-check the backend workspace
pnpm --filter @pharmacy-pos/backend type-check

# Run supplier-specific tests (contract + unit)
pnpm --filter @pharmacy-pos/backend test -- \
  --runTestsByPath \
  backend/modules/suppliers/services/__tests__/query.service.test.ts \
  backend/modules/suppliers/__tests__/suppliers.contract.test.ts
```

Keep the sales module (`backend/modules/sales`) handy as the canonical reference when extending supplier capabilities. Structural parity between the two modules is the baseline for future work.
