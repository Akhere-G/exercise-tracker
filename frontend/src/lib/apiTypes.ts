export interface ValidationError {
  ctx?: { reason: string };
  input: unknown;
  loc: (string | number)[];
  msg: string;
  type: string;
}

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error?: string; errors?: ValidationError[] };
