# Customer Module (ts-rest x RTK Query)

> This feature owns customer CRUD (list / detail / create / update / quick create). Every schema, validation rule, and API contract is sourced from the shared Zod schemas and ts-rest router, so front- and back-end stay in sync.

## Feature Summary

- **Customer list** – search (name, phone, etc.), filter, pagination, cache invalidation.
- **Customer detail** – fetch single record, surface errors, preserve response validation.
- **Customer maintenance** – create, update, delete, quick create by ID number.
- **Quick create** – upsert by ID card and return a `created` indicator.

## Folder Layout

```text
customer/
├─ api/
│  ├─ client.ts                # Contract client built with createCustomersContractClient
│  ├─ customerApi.ts           # RTK Query slice; queryFn talks to the contract client
│  └─ dto.ts                   # Type exports inferred from shared Zod schemas
├─ components/…               # Module-specific UI (list, forms, dialogs)
├─ hooks/…                    # Business hooks (e.g. useCustomerData)
├─ model/                     # Redux slice for UI state (optional)
├─ pages/                     # React Router entry points
├─ services/                  # Service helpers (e.g. customerServiceV2)
└─ README.md                  # This document
```

## API & Service Responsibilities

| File | Role | Notes |
| --- | --- | --- |
| `api/client.ts` | Contract client | Wraps `createCustomersContractClient`; injects Authorization header and keeps the shared response envelope. |
| `api/customerApi.ts` | RTK Query slice | `queryFn` calls the contract client; unwraps `body.data` on success, maps errors to `FetchBaseQueryError`, handles cache tags. |
| `services/customerServiceV2.ts` | Service layer | Uses the contract client for CRUD + quick create; `assertSuccessBody/assertSuccessData/rethrow` keep envelope & error handling consistent for legacy hooks/components. |

> Prefer RTK Query for new work. If a legacy hook still needs the service layer, call service v2 so contract access stays centralized.

## Request Flow (list example)

```
Component → useGetCustomersQuery
          → customerContractClient.listCustomers
          → shared/api/contracts/customers.ts (Zod validation)
          → backend @ts-rest/express handler
```

- Types come from shared schemas (`z.infer`).
- Contract responses stay in the `success/message/data` envelope; only `data` propagates when the status is 200.
- Errors become `FetchBaseQueryError` so UI components see a standard shape.

## Migration Checklist (Axios → ts-rest)

1. **Import types** from shared schemas instead of hand-written interfaces.
2. **Expose operations** through `customerServiceV2.ts` (contract client + helpers) or RTK Query hooks.
3. **Reuse helpers** (`assertSuccessBody/assertSuccessData/rethrow`) to keep messages aligned.
4. **Testing** – use the contract client for integration tests; mock the contract responses with MSW for hook tests.

## FAQ

- **Why keep service v2?** Legacy hooks (e.g. `useCustomerData`) still depend on it. Wrapping the contract client here avoids two divergent code paths.
- **How do cache tags work?** Mutations invalidate `{ type: 'Customer', id: 'LIST' }`, so the list refetches automatically after create/update/delete.
- **What about extra query params?** The shared schema uses `.passthrough()`, so legacy filters still work, but please add official fields to the shared schema and OpenAPI.

---

When raising a PR:
- Include contract/schema diffs (`shared/`, `openapi/`).
- Attach test evidence (unit / integration / contract).
- Describe risk and rollback steps (especially if data migration is involved).

