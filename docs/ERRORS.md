# Error Handling

Error handling for the Usage Metering and Quota Service (Express + TypeScript + Zod + Drizzle + PostgreSQL).

## Principles

1. **Quota rejections are not errors.** A consume request that exceeds a limit is a successfully evaluated decision: return `200` with `allowed: false`. Only protocol, auth, validation, conflict, and infrastructure failures are thrown.
2. **Throw `AppError` subclasses from services and middleware.** Never call `res.status()` for error cases outside the global handler.
3. **One global handler** converts everything into a single response shape.
4. **Never leak internals.** No raw Zod issues, SQL messages, constraint names, stack traces, or secrets in responses.

## File layout

```
src/
├── shared/errors/
│   ├── app-error.ts       # base class + ErrorCode union
│   ├── http-errors.ts     # generic HTTP-level errors
│   ├── domain-errors.ts   # domain-specific errors
│   └── db-errors.ts       # PostgreSQL -> AppError translation
└── middleware/
    └── error-handler.ts   # global Express error middleware
```

## Response format

Every error response has this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "units", "message": "Must be a positive integer" }]
  }
}
```

- `code`: stable, machine-readable. Clients should branch on this, not on `message`.
- `message`: human-readable, safe to display.
- `details`: optional. Present for validation errors.

## Error class reference

### Base

| Class      | Signature                                           |
| ---------- | --------------------------------------------------- |
| `AppError` | `new AppError(statusCode, code, message, details?)` |

### HTTP-level errors (`http-errors.ts`)

| Class                       | HTTP | Allowed codes                                                                                                                                                                 | Use when                                             |
| --------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `BadRequestError`           | 400  | `BAD_REQUEST`                                                                                                                                                                 | Malformed JSON or request structure                  |
| `UnauthorizedError`         | 401  | `UNAUTHORIZED`                                                                                                                                                                | Missing or invalid API key                           |
| `ForbiddenError`            | 403  | `FORBIDDEN`                                                                                                                                                                   | Authenticated but not permitted                      |
| `NotFoundError`             | 404  | `NOT_FOUND`, `USER_NOT_FOUND`, `PLAN_NOT_FOUND`, `ACCOUNT_NOT_FOUND`                                                                                                          | Resource missing **or belongs to another account**   |
| `ConflictError`             | 409  | `CONFLICT`, `USER_ALREADY_EXISTS`, `ACCOUNT_ALREADY_EXISTS`, `PLAN_ALREADY_EXISTS`, `ACCOUNT_HAS_NO_PLAN`, `USER_HAS_NO_PLAN`, `PLAN_IN_USE`, `DUPLICATE_REQUEST_IN_PROGRESS` | Duplicates, missing plan assignment, state conflicts |
| `PayloadTooLargeError`      | 413  | `PAYLOAD_TOO_LARGE`                                                                                                                                                           | Body exceeds size limit                              |
| `UnsupportedMediaTypeError` | 415  | `UNSUPPORTED_MEDIA_TYPE`                                                                                                                                                      | Content-Type is not `application/json`               |
| `ValidationError`           | 422  | `VALIDATION_ERROR`, `INVALID_PLAN_CONFIGURATION`, `PLAN_TYPE_MISMATCH`, `IDEMPOTENCY_KEY_INVALID`, `INVALID_MONTH`, `INVALID_DATE_RANGE`, `INVALID_PAGINATION`                | Valid JSON, invalid values                           |
| `RateLimitedError`          | 429  | `RATE_LIMITED`                                                                                                                                                                | Rate limit exceeded (optional feature)               |
| `ServiceUnavailableError`   | 503  | `SERVICE_UNAVAILABLE`                                                                                                                                                         | Database or dependency unavailable                   |

### Domain errors (`domain-errors.ts`)

| Class                       | HTTP | Code                            | Use when                                           |
| --------------------------- | ---- | ------------------------------- | -------------------------------------------------- |
| `IdempotencyKeyReusedError` | 409  | `IDEMPOTENCY_KEY_REUSED`        | Same `requestId` sent with different user or units |
| `PredefinedPlanError`       | 403  | `CANNOT_MODIFY_PREDEFINED_PLAN` | Attempt to modify a read-only plan                 |

### Not an error class

These are returned as a `200` consumption decision, never thrown:

| Reason                           | Scope   |
| -------------------------------- | ------- |
| `ACCOUNT_REQUEST_LIMIT_EXCEEDED` | account |
| `USER_REQUEST_LIMIT_EXCEEDED`    | user    |
| `ACCOUNT_MONTHLY_LIMIT_EXCEEDED` | account |
| `USER_MONTHLY_LIMIT_EXCEEDED`    | user    |

Evaluate in the order listed and return the first failing rule. A rejection must not increment account or user usage.

## Usage

### Throwing from a service

```ts
import { NotFoundError, ConflictError } from "../shared/errors/http-errors";

async function getUser(accountId: string, userId: string) {
  const user = await usersRepo.findByIdInAccount(accountId, userId);
  if (!user) throw new NotFoundError("USER_NOT_FOUND", "User not found");
  return user;
}

async function assertUserHasPlan(user: User) {
  if (!user.planId) {
    throw new ConflictError("USER_HAS_NO_PLAN", "User has no assigned plan");
  }
}
```

### API key middleware

```ts
import { UnauthorizedError } from "../shared/errors/http-errors";

export const apiKeyAuth: RequestHandler = async (req, _res, next) => {
  const key = req.header("x-api-key");
  if (!key) throw new UnauthorizedError();

  const account = await accountsRepo.findByApiKey(key);
  if (!account) throw new UnauthorizedError();

  req.account = account;
  next();
};
```

### Validation with details

Zod errors are converted automatically by the global handler. To throw manually:

```ts
import { ValidationError } from "../shared/errors/http-errors";

if (plan.maxUnitsPerRequest > plan.monthlyAllowance) {
  throw new ValidationError(
    [
      {
        field: "maxUnitsPerRequest",
        message: "Must not exceed monthlyAllowance",
      },
    ],
    "INVALID_PLAN_CONFIGURATION",
  );
}
```

Query parameters:

```ts
if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
  throw new ValidationError(
    [{ field: "month", message: "Expected format YYYY-MM" }],
    "INVALID_MONTH",
  );
}
```

### Idempotency

```ts
import { IdempotencyKeyReusedError } from "../shared/errors/domain-errors";

const existing = await usageRepo.findByRequestId(accountId, requestId);
if (existing) {
  if (existing.userId !== userId || existing.units !== units) {
    throw new IdempotencyKeyReusedError();
  }
  return existing.decision; // identical retry: return original decision
}
```

### Quota rejection (returned, not thrown)

```ts
if (units > userPlan.maxUnitsPerRequest) {
  return {
    allowed: false,
    consumedUnits: 0,
    reason: "USER_REQUEST_LIMIT_EXCEEDED",
    limitScope: "user",
  } as const;
}
```

### Protecting read-only plans

```ts
import { PredefinedPlanError } from "../shared/errors/domain-errors";

if (plan.isPredefined) throw new PredefinedPlanError();
```

## Database error translation

`translateDbError` in `db-errors.ts` maps PostgreSQL errors to `AppError`s. The global handler calls it for any non-`AppError`.

| PostgreSQL                                                         | Meaning                    | Result                                                                    |
| ------------------------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------- |
| `23505`                                                            | unique violation           | Mapped via `UNIQUE_MAP` by constraint name; unmapped falls through to 500 |
| `23503`                                                            | foreign key violation      | `409 CONFLICT`                                                            |
| `23514`                                                            | check violation            | `422 INVALID_PLAN_CONFIGURATION`                                          |
| `08*`, `57P01`, `53300`, `ECONNREFUSED`, `ETIMEDOUT`, `ECONNRESET` | connection or availability | `503 SERVICE_UNAVAILABLE`                                                 |
| anything else                                                      | unexpected                 | `500 INTERNAL_SERVER_ERROR`                                               |

To support a new unique constraint, add its **real** constraint name (check your Drizzle schema or `\d table` in psql):

```ts
const UNIQUE_MAP: Record<string, () => AppError> = {
  users_account_email_unique: () =>
    new ConflictError("USER_ALREADY_EXISTS", "User already exists"),
  // add more here
};
```

Rely on the unique constraint for idempotency races: catch the unique violation, re-read the existing row, then compare payloads as shown above.

## Global handler

Register it **after** all routes:

```ts
app.use(express.json({ limit: "100kb" }));
app.use("/api/v1", apiKeyAuth, apiRouter);
app.use(errorHandler);
```

Handled by `errorHandler`:

| Source                                      | Result                                   |
| ------------------------------------------- | ---------------------------------------- |
| body-parser `entity.parse.failed`           | 400 `BAD_REQUEST`                        |
| body-parser `entity.too.large`              | 413 `PAYLOAD_TOO_LARGE`                  |
| body-parser unsupported charset or encoding | 415 `UNSUPPORTED_MEDIA_TYPE`             |
| `ZodError`                                  | 422 `VALIDATION_ERROR` with `details`    |
| `AppError`                                  | its own status and code                  |
| PostgreSQL errors                           | translated, see above                    |
| anything else                               | logged, then 500 `INTERNAL_SERVER_ERROR` |

### Express 4 and async handlers

Express 4 does not forward rejected promises to the error middleware. Either wrap handlers:

```ts
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
```

or use `express-async-errors`. Express 5 handles this natively.

## Adding a new error

1. Add the code to the `ErrorCode` union in `app-error.ts`.
2. If it fits an existing class, add the code to that class's allowed codes. Otherwise create a subclass:
   ```ts
   export class MyError extends AppError {
     constructor() {
       super(409, "MY_CODE", "Human-readable message");
     }
   }
   ```
3. Document it in the tables above.
4. Add a test asserting status and code.

## Testing

Assert both status and `error.code`:

```ts
it("returns 401 for a missing API key", async () => {
  const res = await request(app).post("/api/v1/usage/consume").send({});
  expect(res.status).toBe(401);
  expect(res.body.error.code).toBe("UNAUTHORIZED");
});

it("returns 200 with allowed=false on quota rejection", async () => {
  const res = await consume({ userId, units: 25, requestId: "req_1" });
  expect(res.status).toBe(200);
  expect(res.body).toMatchObject({
    allowed: false,
    reason: "USER_REQUEST_LIMIT_EXCEEDED",
    consumedUnits: 0,
  });
});

it("returns 409 when a requestId is reused with different units", async () => {
  await consume({ userId, units: 5, requestId: "req_2" });
  const res = await consume({ userId, units: 6, requestId: "req_2" });
  expect(res.status).toBe(409);
  expect(res.body.error.code).toBe("IDEMPOTENCY_KEY_REUSED");
});
```

Also cover: cross-account access returns `404`, concurrent consumption never exceeds the allowance, and rejected requests leave usage totals unchanged.
