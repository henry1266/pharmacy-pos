## ADDED Requirements
### Requirement: Purchase order read APIs use shared contract schemas
Backend purchase order list and detail endpoints MUST be implemented through a ts-rest router generated from shared zod schemas to enforce a single source of truth.

#### Scenario: List endpoint validates responses
- **GIVEN** a purchase order list is requested through /purchase-orders
- **WHEN** the server returns the response
- **THEN** the payload MUST be parsed with the shared list schema before being sent to the client.

#### Scenario: Detail endpoint validates responses
- **GIVEN** a purchase order detail is requested through /purchase-orders/:id
- **WHEN** the server resolves the record
- **THEN** the payload MUST be parsed with the shared detail schema before being sent to the client.

### Requirement: Purchase order UI consumes shared contract types
Frontend purchase order list experiences MUST consume the generated contract client so that view models match the shared schemas without local duplication.

#### Scenario: List hook uses contract client
- **GIVEN** the purchase order list hook fetches data
- **WHEN** the hook requests list data
- **THEN** it MUST call the generated contract client and rely on the shared types for the returned shape.

#### Scenario: Components avoid duplicate types
- **GIVEN** purchase order components render list rows
- **WHEN** type definitions are imported
- **THEN** they MUST reference the shared schema-derived types instead of local interface copies.
