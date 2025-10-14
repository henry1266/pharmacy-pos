## 1. Analysis
- [x] 1.1 Audit current supplier feature folders/files and map each item to the target sale blueprint category.
- [x] 1.2 Identify all import paths referencing `features/supplier/config/*` or other soon-to-be-moved files.

## 2. Restructure
- [x] 2.1 Create `constants/`, `model/`, and `utils/` folders; relocate or split existing logic accordingly.
- [x] 2.2 Update RTK Query, service helpers, and component imports to new locations; ensure type exports remain stable.
- [x] 2.3 Introduce or update barrel files (`index.ts`) so consuming modules keep simple import surfaces.

## 3. Documentation & Validation
- [x] 3.1 Rewrite `features/supplier/README.md` to mirror the sale feature template and document SSOT references.
- [x] 3.2 Run relevant lint/test suites (at minimum affected unit tests) and attach evidence in PR. *(Fails: `sale/utils/__tests__/saleTotals.test.ts` rounding expectations; employees overtime test missing service mock path.)*
- [x] 3.3 Execute `openspec validate refactor-supplier-module-structure --strict` and include results.
