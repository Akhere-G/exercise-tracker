export interface ValidationError {
  ctx?: { reason: string };
  input: unknown;
  loc: (string | number)[];
  msg: string;
  type: string;
}

export type ActionResponse<T> =
  | { success: true; data: T }
  | {
      success: false;
      // Always a readable message, ready to show in a toast.
      error?: string;
      // The raw API `detail`: a string for most errors, a list for validation.
      errors?: ValidationError[] | string;
      status?: number;
    };
