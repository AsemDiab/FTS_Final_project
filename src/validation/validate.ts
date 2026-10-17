import type { RequestHandler, Response } from "express";
import type { ZodType, z } from "zod";

interface Schemas {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
}

/**
 * Validates body/params/query. On failure it throws a ZodError, which the
 * global error handler converts to `422 VALIDATION_ERROR`.
 *
 * Parsed values are stored on `res.locals.validated` (and `req.body` is replaced).
 * `req.query` is not reassigned because it is read-only in Express 5.
 */
export const validate =
  (schemas: Schemas): RequestHandler =>
  (req, res, next) => {
    const validated: { body?: unknown; params?: unknown; query?: unknown } = {};

    if (schemas.params) validated.params = schemas.params.parse(req.params);
    if (schemas.query) validated.query = schemas.query.parse(req.query);
    if (schemas.body) {
      validated.body = schemas.body.parse(req.body ?? {});
      req.body = validated.body;
    }

    res.locals.validated = validated;
    next();
  };

/** Typed accessor for parsed input inside controllers. */
export function getValidated<S extends ZodType>(
  res: Response,
  key: "body" | "params" | "query",
  _schema?: S, // only used to infer T
): z.infer<S> {
  return res.locals.validated[key] as z.infer<S>;
}
