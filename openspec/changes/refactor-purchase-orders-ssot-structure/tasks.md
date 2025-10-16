## 1. Shared SSOT Expansion
- [ ] 1.1 Extend the shared purchase order schemas to expose create/update payload builders, mutation response wrappers, and shared error discriminators.
- [ ] 1.2 Broaden the ts-rest purchase order contract to cover mutations and filtered list endpoints, re-exporting the generated client for downstream consumers.
- [ ] 1.3 Regenerate contract artifacts and update any barrel files so the expanded SSOT types are consumable by backend and frontend packages.

## 2. Backend Refactor
- [ ] 2.1 Replace bespoke express routes with contract handlers, wiring shared validators and response mappers through a single ts-rest router.
- [ ] 2.2 Move serialization and error-normalization helpers into reusable utilities consumed by every purchase order handler.
- [ ] 2.3 Add contract-centric tests for list/detail/mutation/filtered flows that assert both success and failure shapes.

## 3. Frontend Alignment
- [ ] 3.1 Update purchase order hooks, forms, and mutations to call the generated contract client and rely on shared zod types for validation.
- [ ] 3.2 Remove redundant DTO converters and interface copies in the purchase order feature, replacing them with imports from the shared SSOT package.
- [ ] 3.3 Update UX flows or Storybook stories to exercise the new contract client and ensure typed payloads render as expected.

## 4. Validation & Enablement
- [ ] 4.1 Document the contract-first purchase order architecture in the feature ADR/README with migration guidance for other teams.
- [ ] 4.2 Run lint, tests, and `openspec validate refactor-purchase-orders-ssot-structure --strict`.
