export interface FastAPIError {
  success: boolean;
  error: ValidationError[];
}
export interface ValidationError {
  ctx: { reason: string };
  input: string;
  loc: string[];
  msg: string;
  type: string;
}

export function isValidationError(err: unknown): err is FastAPIError {
  return (
    !!err &&
    typeof err === "object" &&
    "success" in err &&
    typeof err.success === "boolean" &&
    "error" in err &&
    Array.isArray(err.error)
  );
}

export function getValidationErrors(errorList: ValidationError[]) {
  const errors: Record<string, string> = {};

  for (const e of errorList) {
    const fieldName = e.loc[e.loc.length - 1];
    if (fieldName !== "body") {
      errors[fieldName] = e.msg;
    }
  }

  return errors;
}
