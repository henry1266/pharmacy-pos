# Purchase Order Feature

The purchase order feature renders the admin list, detail view, and mutation flows backed by the shared TS-Rest contract.

## Contract-First Flow

- **Shared SSOT:** `@pharmacy-pos/shared/schemas/purchase-orders` exposes the canonical summary/detail envelopes plus the `buildCreatePurchaseOrderPayload` / `buildUpdatePurchaseOrderPayload` helpers for payload validation. Types live in `@pharmacy-pos/shared/types/purchase-order` and should be imported instead of duplicating interfaces.
- **Generated client:** `frontend/src/features/purchase-order/api/client.ts` exports `purchaseOrdersContractClient`, which now covers list, detail, create, update, delete, and filtered query endpoints. No bespoke axios wrapper is required.
- **Frontend integration:** Hooks (`usePurchaseOrdersList`, `usePurchaseOrderData`, `useDailyStats`) and Redux actions dispatch contract responses directly, reusing shared builders to validate outgoing payloads. UI components consume the inferred summary/detail types, ensuring backend and frontend stay aligned.
- **Backend alignment:** The Express router mounts `purchaseOrdersContract`; shared response mappers and contract tests (`backend/modules/purchaseOrders/__tests__/purchaseOrders.contract.test.ts`) enforce the same shapes exercised by the client.

## Key Files

- `hooks/usePurchaseOrdersList.ts` – contract-backed list hook with filtering, preview, unlock, and delete helpers.
- `hooks/usePurchaseOrderData.ts` – form bootstrap hook that loads detail data through the contract client.
- `api/client.ts` – thin factory around `purchaseOrdersContractClient`; re-exported via `@pharmacy-pos/shared`.
- `redux/actions.ts` – purchase order actions that call the contract and run shared payload builders before mutations.
- `components/PurchaseOrderDetailPanel.tsx` – renders preview data using shared summary/detail types.

## Migration Tips

1. Import `purchaseOrdersContractClient` (or the shared re-export) instead of hand-written fetchers.
2. Build mutation bodies with `buildCreatePurchaseOrderPayload` / `buildUpdatePurchaseOrderPayload` to catch zod validation errors locally.
3. When adding new contract routes, update the shared schema first, regenerate clients if necessary, then run `openspec validate refactor-purchase-orders-ssot-structure --strict`.
4. Avoid storing ad-hoc DTOs; prefer the shared summary/detail types or infer from the contract (`ClientInferResponse`).

Keep contract changes and implementation in lockstep to preserve the single source of truth across packages.