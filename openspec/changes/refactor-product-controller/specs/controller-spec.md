# Delta Spec: Product Controller Refactor

## ADDED Requirements

### Requirement: CRUD Helper Utilities

The system MUST provide reusable helper functions for common CRUD operations.

#### Scenario: checkExists helper validates entity existence

- GIVEN a table and an ID
- WHEN the helper is called
- THEN it returns the entity if found
- AND throws NotFoundError if not found

#### Scenario: buildPaginatedQuery constructs filtered queries

- GIVEN pagination params (page, limit, sortBy, sortOrder)
- AND optional filters (search term, category, stock status)
- WHEN the helper is called
- THEN it returns a configured query with conditions applied

### Requirement: Standardized Response Helper

The system SHOULD provide a uniform response formatting utility.

#### Scenario: successResponse formats success responses

- GIVEN data and an optional message
- WHEN successResponse is called
- THEN it returns ResponseSchema-compatible object

## MODIFIED Requirements

### Requirement: Product Controller Error Handling

(Previously: Mixed asyncHandler and manual try-catch)

The product controller MUST use asyncHandler consistently for all async operations.

#### Scenario: All endpoints use asyncHandler wrapper

- GIVEN any product controller endpoint
- WHEN an error occurs
- THEN it propagates to the error handling middleware
- AND no manual try-catch blocks exist in controller methods

### Requirement: Product Controller Validation

(Previously: Mix of IdSchema.parse() and direct param access)

The product controller MUST validate all inputs via middleware (validateParams/validateBody).

#### Scenario: ID validation uses validateParams middleware

- GIVEN a request with :id parameter
- WHEN the request reaches the controller
- THEN the ID has been validated by ParamsIdSchema middleware
- AND the controller receives a validated ID

## REMOVED Requirements

### Requirement: Manual Try-Catch Error Handling

(Reason: Replaced by asyncHandler pattern)

The product controller MUST NOT contain manual try-catch blocks for error handling.
