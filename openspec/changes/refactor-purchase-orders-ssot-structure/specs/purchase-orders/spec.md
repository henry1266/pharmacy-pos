## MODIFIED Requirements
### Requirement: Purchase order APIs use shared contract schemas
All purchase order HTTP endpoints MUST be served through the ts-rest router using the shared zod schemas so that every request/response conforms to the single source of truth.

#### Scenario: Create endpoint validates request body
- **WHEN** a client calls POST /purchase-orders through the contract client
- **THEN** the incoming payload MUST be parsed with the shared create schema before invoking the service, and the success response MUST be serialized with the detail schema.

#### Scenario: Update endpoint normalizes responses
- **WHEN** PUT /purchase-orders/:id resolves through the contract server
- **THEN** the returned record MUST be validated against the detail schema and wrapped in the shared success envelope before being sent to the client.

#### Scenario: Filtered list endpoints reuse summary schema
- **GIVEN** a consumer requests recent, by-supplier, or by-product purchase orders
- **THEN** the handler MUST source its data from the contract router and emit the shared summary list schema without bespoke mappers.

### Requirement: Purchase order UI consumes shared contract types
Purchase order frontend features MUST use the generated ts-rest client and zod-derived types for both queries and mutations to avoid duplicating domain models.

#### Scenario: Mutation hooks use contract client
- **WHEN** the purchase order create or update form submits data
- **THEN** it MUST call the generated contract mutation and rely on the shared input schema for client-side validation.

#### Scenario: Filtered queries rely on summary types
- **WHEN** UI components render lists filtered by supplier, product, or recency
- **THEN** they MUST import the shared summary types from the contract client instead of defining local interfaces.

## ADDED Requirements
### Requirement: Purchase order contract centralizes error serialization
The purchase order contract MUST expose a shared error schema so that all handlers return consistent status codes and payload shapes for validation and domain failures.

#### Scenario: Validation failure yields typed error
- **WHEN** a mutation payload fails zod validation in the contract handler
- **THEN** the response MUST be a 400 status using the shared error schema with field-level messages.

#### Scenario: Conflict propagates through error handler
- **WHEN** the service signals a conflicting purchase order or immutable state
- **THEN** the contract error handler MUST translate it into a 409 response matching the shared error schema.
