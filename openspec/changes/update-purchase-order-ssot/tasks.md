## 1. Shared Domain Modeling
- [x] 1.1 Add purchase order summary and detail zod schemas under shared/schemas/purchase-orders.
- [x] 1.2 Define ts-rest contract endpoints for listing purchase orders and fetching a single purchase order.

## 2. Backend Alignment
- [x] 2.1 Replace existing purchase order read routes with the contract router while keeping mutation handlers untouched.
- [x] 2.2 Add contract-based integration tests that assert list and detail responses conform to the shared schemas.

## 3. Frontend Adoption
- [x] 3.1 Update usePurchaseOrdersList to call the generated contract client instead of bespoke fetch utilities.
- [x] 3.2 Remove duplicate purchase order types and rely on the shared schema in the list page and related components.

## 4. Validation
- [x] 4.1 Document the new SSOT flow for purchase orders in the feature README or ADR.
- [x] 4.2 Run lint, tests, and openspec validate update-purchase-order-ssot --strict.
