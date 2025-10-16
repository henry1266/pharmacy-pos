## Why
- Purchase order pages still depend on ad-hoc interfaces under rontend/src/features/purchase-order/types, so the UI diverges from backend payloads and we lack a single shared schema.
- There is no zod-first contract for purchase-order APIs, so responses are not validated or typed consistently between services.
- Without a ts-rest contract and generated client, the purchase order list hook manually builds fetchers, making SSOT adoption harder and riskier to evolve.

## What Changes
- Introduce shared zod schemas for purchase order summary and detail records, and define a ts-rest contract that exposes the list and detail read endpoints.
- Wire the backend purchase order read endpoints through the new contract router while keeping mutations unchanged to keep the scope minimal.
- Refactor the frontend list hook and related components to call the generated contract client and remove duplicate type definitions.

## Impact
- Backend and frontend build steps must pick up the generated contract artifacts, so CI pipelines and local builds need to be verified.
- Frontend purchase order pages will receive typed data from the contract, requiring UI adjustments where loose ny values were assumed.
- Establishing the SSOT foundation unlocks follow-up work to migrate create/update flows without large rewrites.
