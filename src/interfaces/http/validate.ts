import type { Request, Response } from "express";
import type { ZodType } from "zod";

export function parseBody<T>(
  schema: ZodType<T>,
  req: Request,
  res: Response,
): T | null {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => issue.message)
      .join("; ");
    res.status(400).json({ success: false, error: message });
    return null;
  }
  return result.data;
}
