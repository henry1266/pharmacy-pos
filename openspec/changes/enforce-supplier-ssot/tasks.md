## 1. Contract & Schema Alignment
- [x] 1.1 Add Zod schemas for supplier account-mapping requests/responses under shared/schemas/zod.
- [x] 1.2 Create supplier account-mapping ts-rest contract and client exports in shared/api/contracts and shared/api/clients.
- [x] 1.3 Regenerate shared OpenAPI/client artifacts.

## 2. Backend Integration
- [x] 2.1 Replace manual account-mapping routes with ts-rest handlers using the new contract.
- [x] 2.2 Remove suppliers.controller.ts and ensure router wiring exclusively uses the contract implementation.
- [x] 2.3 Update backend tests to cover the new contract endpoints and validation paths.

## 3. Frontend Adoption
- [x] 3.1 Refactor supplier account-mapping UI to consume the new contract client.
- [x] 3.2 Replace legacy SupplierApiClient usage with contract-driven calls; remove or wrap the legacy client.
- [ ] 3.3 Add/adjust frontend tests covering CRUD flows via the contract client.

## 4. Documentation & Validation
- [x] 4.1 Update feature READMEs 和開發者指南，明確要求程式註解一律使用繁體中文並反映 contract-only 流程。
- [x] 4.2 Run lint/type-check/test suites for affected workspaces.
- [ ] 4.3 Execute openspec validate enforce-supplier-ssot --strict.
