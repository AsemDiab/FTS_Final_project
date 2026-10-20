# Product Assumptions

**Purpose:** Define product behavior before implementation begins.

This document fills gaps in the Usage Metering and Quota Service project brief. It is a product-level agreement, not a description of any particular code, database schema, or implementation.

Explicit requirements in the project brief take precedence over these assumptions. Where the brief is silent, the defaults below apply unless the project owner chooses otherwise.

## 1. Quota model

### 1.1 Two independent quota levels
Every consumption request is subject to two independent limits:
- **Account quota:** Monthly usage shared by all users belonging to the account.
- **User quota:** Monthly usage attributable to the individual user.

A request succeeds only if it satisfies all applicable account-level and user-level rules. On success, the requested quantity is added to both the account's usage and the user's usage. On rejection, neither usage total increases.

**Reason:** The account limit controls aggregate consumption, while the user limit prevents one user from consuming more than their individual allowance.

### 1.2 Monthly usage period
Usage is measured by UTC calendar month. Each month begins at `00:00:00 UTC` on the first day and ends immediately before the first day of the next month. Each request belongs to the month in which the service processes it.

Past monthly usage remains available for historical queries.

**Reason:** UTC gives clients and accounts a consistent month boundary regardless of local time zones or daylight-saving changes.

### 1.3 Monthly allowance boundary
A request is allowed when the resulting usage is less than or equal to the applicable monthly allowance. A request that brings usage exactly to the limit is allowed; a request that would exceed it is rejected.

**Reason:** The allowance represents the maximum permitted usage, including the final unit.

### 1.4 Maximum units per request
The maximum units per request is independent of the monthly allowance. A request exceeding the per-request maximum is rejected even if enough monthly allowance remains.

**Reason:** A per-request limit controls the size of one operation, while the monthly limit controls cumulative consumption.

### 1.5 Quantity
Consumption quantities must be positive whole numbers. Zero, negative values, fractional values, and values outside the supported range are invalid.

**Reason:** Usage is counted in discrete units, and invalid quantities should never change usage.

### 1.6 Atomic decisions
The account and user checks and corresponding usage increments form one logical operation. If any rule fails, no usage is consumed. Simultaneous requests must not be able to exceed either quota simply because they were checked at the same time.

**Reason:** Partial updates or race conditions could otherwise produce incorrect usage totals.

## 2. Plans

### 2.1 Predefined plans
The product includes these predefined plan types:
- Account plans: **Starter** and **Pro**.
- User plans: **Basic** and **Premium**.

Each plan defines a monthly allowance and a maximum number of units per request. Exact example limits should be selected and documented before implementation and used consistently in examples and tests.

**Reason:** Separating account plans from user plans makes the two quota levels explicit.

### 2.2 Custom plans
Accounts may own custom plans, subject to the product's supported plan-management operations. A custom plan is private to its owning account and cannot be used or managed by unrelated accounts.

**Reason:** Account ownership prevents one customer from accessing another customer's configuration.

### 2.3 Plan changes
A plan change takes effect for consumption requests processed after the change succeeds. It does not retroactively alter usage already recorded or rewrite past consumption decisions.

**Reason:** Customers should see the new rules applied predictably without losing the historical explanation of previous decisions.

### 2.4 Missing plan assignment
If an account or user lacks a required valid plan assignment, consumption is rejected with a clear error. Missing configuration never means unlimited usage.

**Reason:** A safe, explicit failure is preferable to accidentally permitting unmetered consumption.

## 3. Consumption requests and retries

### 3.1 Idempotency
Consumption requests support an idempotency key so a client can safely retry after a timeout or uncertain response. Repeating the same logical request with the same key returns the original outcome and does not consume usage a second time.

The key is scoped to the authenticated account. The service retains enough information to determine whether a repeated key represents the same request.

**Reason:** Network failures can prevent clients from receiving a response even when the server processed the request.

### 3.2 Reusing an idempotency key
If a key is reused for a different request, the service rejects the new request with a clear conflict error. The original result remains unchanged.

**Reason:** One idempotency key must identify one logical operation.

### 3.3 Accepted and rejected attempts
Both accepted and rejected consumption attempts should be recorded in request history. Rejected attempts do not increase usage totals. History should explain the decision, including the outcome, rejection reason where applicable, requested quantity, time, and relevant account/user context.

**Reason:** Recording decisions makes failures diagnosable and allows customers to understand why an operation was rejected.

### 3.4 Historical decisions
A historical consumption record must remain understandable after a plan changes. It should preserve the effective limits used to evaluate the request, or equivalent information sufficient to reconstruct that decision reliably.

**Reason:** Looking up only the current plan would not reliably explain a decision made under an earlier plan.

### 3.5 Retention
Historical monthly usage and consumption decisions remain queryable. No automatic expiry period is assumed for idempotency keys or history unless a retention policy is explicitly chosen.

**Reason:** Silent expiry or deletion could undermine retries and historical reporting.

## 4. API key security and account boundaries

### 4.1 API key usage
Protected account-scoped requests authenticate using an account API key in a documented HTTP request header. API keys must not be sent in URL query parameters.

**Reason:** URLs are commonly captured in logs, browser history, and monitoring systems.

### 4.2 API key creation and storage
API keys are generated using cryptographically secure randomness. The service does not store raw API keys in plaintext and does not include them in application logs. The raw key is shown to the client only when it is issued, unless an explicit rotation flow requires issuing a replacement.

Administrative credentials are separate from customer account API keys.

**Reason:** Limiting exposure reduces the impact of database leaks and accidental log disclosure.

### 4.3 Account isolation
The API key determines the account context for a protected request. A caller cannot gain access to another account's users, plans, usage, or history by supplying another resource's ID.

**Reason:** Client-supplied identifiers are not proof of ownership or authorization.

### 4.4 Inaccessible resources
If a resource does not exist or belongs to another account, the API should avoid revealing private information about another account. Use a consistent response policy for these cases.

**Default:** Return `404 Not Found` for account-scoped resources that are not accessible to the caller, unless an endpoint has a documented reason to use a different response.

**Reason:** This avoids confirming that another customer's resource exists.

## 5. Validation and errors

### 5.1 Input validation
Invalid request bodies, identifiers, quantities, and required headers are rejected before the operation changes usage.

### 5.2 Error responses
Errors use a consistent JSON format with a stable machine-readable code and a human-readable message. Responses do not expose secrets, database internals, or stack traces.

The API distinguishes at least:
- Authentication failures.
- Invalid input.
- Missing or inaccessible resources.
- Quota rejections.
- Idempotency conflicts.
- Unexpected server failures.

**Reason:** Consistent errors make the API easier to integrate with and safer to operate.

### 5.3 Server-controlled time
The service determines the timestamp and monthly usage period for a consumption decision. A client cannot choose an arbitrary timestamp to move usage into a different month.

**Reason:** Monthly quota enforcement must use a trusted and consistent clock.

## 6. Product scope

The service is a usage metering and quota enforcement API. It is not a billing or payment system.

Unless the project requirements change, the product does not include:
- Payment processing or invoicing.
- Refunds or reversal workflows.
- Multiple resource types.
- End-user authentication.
- Complex role-based permissions.
- Redis, Kafka, microservices, or other additional infrastructure without a demonstrated need.

**Reason:** Keeping scope narrow makes it possible to deliver and test the core quota behavior reliably within the project timeline.

## 7. Decisions requiring product-owner confirmation

The following are genuine product choices for which the project brief does not provide an exact answer. The defaults above are recommended so development can proceed without blocking.

1. **Exact plan limits:** What monthly allowances and per-request maxima should Starter, Pro, Basic, and Premium use? Select illustrative values before implementation.
2. **Plan change timing:** The default is immediate effect for subsequent requests. Should changes instead take effect at the next UTC month?
3. **Rejected attempt history:** The default is to record rejected attempts without changing usage. Is this desired for the product?
4. **Idempotency retention:** The default is no automatic expiry. Is indefinite retention acceptable for this project's scope, or should keys expire after a defined period?
5. **History retention:** The default is to retain historical usage and decisions. Is a finite retention period required?
6. **Resource-not-accessible response:** The default is `404 Not Found` to avoid disclosing cross-account resource existence. Is that the desired API behavior?

These questions concern product behavior, not details of the current implementation. They can be answered now or accepted with the documented defaults.

## 8. Change policy

If a product assumption changes:
1. Update this document and explain the reason.
2. Update API documentation and examples where behavior is visible to clients.
3. Add or update tests for the new behavior.
4. Ensure related product rules remain consistent.

Do not silently change a product rule in only one endpoint or module.
