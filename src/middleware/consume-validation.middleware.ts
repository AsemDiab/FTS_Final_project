import { BadRequestError } from "../errors/http-errors.js";
import { consumeBody } from "../validation/consumption.schema.js";

export async function consumeValidationMiddleware(req, res, next) {
  const { userId, requestId, units } = req.body;
  const { error } = await consumeBody.validate(
    { userId, requestId, units },
    { abortEarly: false },
  );
  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    throw new BadRequestError("Validation failed", errorMessages);
  }
  next();
}
