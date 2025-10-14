## Why
- Supplier feature still follows an older folder layout (`config/`, missing `model/`, `utils/`) that diverges from the standardized sale feature blueprint.
- Divergent structure makes shared tooling, onboarding, and cross-feature consistency checks harder to run and increases defect surface.
- Aligning supplier with the sale blueprint unlocks SSOT reuse, predictable hook/service layering, and lowers coordination cost across agents.

## What Changes
- Adopt the sale module structure as the canonical template for supplier (add `constants/`, `model/`, `utils/`; migrate current `config/` content and update exports).
- Update supplier README to document the new boundaries, lifecycle, and SSOT contract usage mirroring sale.
- Provide migration guidance for existing imports (`config/` → `constants/`, new entry points) and ensure RTK Query/service usage stays intact.
- Capture guardrails for future supplier feature additions via spec requirements under `supplier-management`.

## Impact
- **Frontend Builder**: Needs to reorganize files, update barrel exports, and refresh docs/tests for the supplier feature.
- **Schema Steward**: No schema changes, but must verify SSOT references remain accurate after docs update.
- **API Contract Enforcer**: No backend impact; ensure supplier API client paths remain unchanged.
- Change classified as `refactor`; no production behavior change expected, but file moves may require coordinated merge timing.
