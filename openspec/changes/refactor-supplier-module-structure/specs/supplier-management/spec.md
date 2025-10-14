## ADDED Requirements

### Requirement: Supplier Feature Folder Layout
The supplier frontend feature MUST adopt the canonical folder layout established by the sale feature to ensure consistency and discoverability.

#### Scenario: Align top-level directories
- **WHEN** a contributor opens `frontend/src/features/supplier`
- **THEN** they find the top-level directories `api/`, `components/`, `constants/`, `hooks/`, `model/`, `pages/`, `types/`, `utils/`, and a `README.md`
- **AND** no legacy `config/` folder remains.

#### Scenario: Shared utility placement
- **WHEN** reusable calculation or formatting helpers are required for supplier flows
- **THEN** those helpers reside under `frontend/src/features/supplier/utils/`
- **AND** feature-specific configuration constants live under `frontend/src/features/supplier/constants/`.

### Requirement: Supplier Feature Documentation
The supplier feature MUST document its SSOT dependencies and usage patterns in parity with the sale feature.

#### Scenario: README parity
- **WHEN** reviewing `frontend/src/features/supplier/README.md`
- **THEN** it explains SSOT sources (`shared/schemas/zod`, `shared/api/contracts`) and module layering (`api → hooks → components/pages`) using the sale README structure as reference.

### Requirement: Stable Public Imports
The supplier feature MUST expose stable import paths after restructuring so downstream modules do not break.

#### Scenario: Barrel exports updated
- **WHEN** another module imports supplier hooks or components via documented entry points
- **THEN** the restructure provides updated barrel exports or migration notes so the imports resolve without type errors.
