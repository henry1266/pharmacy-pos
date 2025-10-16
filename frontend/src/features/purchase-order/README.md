# Purchase Order Feature

This feature renders and manages the purchase order list, detail preview, and related actions in the admin UI.

## SSOT Contract Flow

- **Shared schemas:** The canonical list and detail shapes live in `@pharmacy-pos/shared/schemas/purchase-orders`. Any consumer should prefer `PurchaseOrderSummary` / `PurchaseOrderDetail` from `@pharmacy-pos/shared/types/purchase-order`.
- **Contract client:** The list uses the generated TS-Rest client provided by `frontend/src/features/purchase-order/api/client.ts` (`purchaseOrdersContractClient`) to call the backend `listPurchaseOrders` and `getPurchaseOrderById` endpoints.
- **Hook integration:** `usePurchaseOrdersList` (under `hooks/`) fetches data through the contract client, normalises it with the shared schemas, and exposes filtering/search helpers to the page.
- **Backend alignment:** The Express router mounts `purchaseOrdersContract` for the read endpoints, so the same schema governs backend responses, frontend consumption, and tests.

## Key Files

- `hooks/usePurchaseOrdersList.ts` – contract-backed list hook with filtering, preview, and deletion helpers.
- `api/client.ts` – exports Axios helpers for mutations and the SSOT contract client for reads.
- `components/PurchaseOrderDetailPanel.tsx` – renders the preview panel driven by the shared detail type.

Keep new behaviour in sync by updating the shared schema first, regenerating consumers, and validating with `openspec validate <change-id> --strict`.
