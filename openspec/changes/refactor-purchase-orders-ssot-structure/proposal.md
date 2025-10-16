## Why
- Purchase order mutations, filtered list endpoints, and background helpers still bypass the shared zod schemas, so request bodies and service outputs drift from the documented contract.
- The express router mixes ts-rest handlers with bespoke routes, duplicating success/error wrappers and forcing manual serialization logic for every response.
- Frontend create/update flows call ad-hoc fetch utilities that ignore the generated contract client, making SSOT adoption incomplete and risky to extend.

## What Changes
- Extend the shared purchase order schemas to cover create/update payloads, mutation responses, and filtered list queries so that every API surface can be expressed via the contract.
- Expand the ts-rest purchase order contract and rewrite the backend router to exclusively use contract handlers, consolidating validation, serialization, and error mapping.
- Update frontend purchase order hooks/forms to rely on the generated contract client for mutations and filtered queries, removing redundant DTO converters.

## Impact
- Regenerated contract clients will change import paths and types for every purchase order consumer; dependent modules must be updated in lockstep.
- Backend service methods will now throw typed errors that bubble through the contract error handler, so integration tests need updates to assert the new shapes.
- CI/CD pipelines must ensure contract generation runs before builds; local scripts may need adjustments to account for the expanded artifact set.
