## Why
- Supplier account-mapping flows still bypass the shared ts-rest contract, so those requests are not validated against Zod schemas and can drift from the SSOT.
- Legacy `SupplierApiClient` continues to expose a schema-less REST client, allowing new call sites to avoid the contract.
- The backend retains an unused controller that could be reattached accidentally, diluting the single entry point enforced by the contract router.

## What Changes
- Model supplier account-mapping endpoints in shared Zod schemas and a ts-rest contract, update backend/frontend to adopt the contract-first clients.
- Replace or remove the legacy `SupplierApiClient`, ensuring only contract-generated clients are available to consumers.
- Harden backend routing so the ts-rest router is the sole handler, updating docs and removing obsolete layers.

## Impact
- Frontend account-mapping workflows will migrate to contract clients; QA will need regression coverage.
- Backend will require new schema/contract validation and may affect OpenAPI generation.
- Deprecating the legacy client could require downstream updates where it is currently imported.
