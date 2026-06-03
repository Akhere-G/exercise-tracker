/* eslint-disable @typescript-eslint/no-explicit-any */
export function snakeToCamel(str: string): string {
  return str.replace(/([-_][a-z0-9])/gi, (match) =>
    match.toUpperCase().replace("-", "").replace("_", ""),
  );
}

export function keysToCamel(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((v) => keysToCamel(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [snakeToCamel(key)]: keysToCamel(obj[key]),
      }),
      {},
    );
  }
  return obj;
}

export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`);
}

export function keysToSnake(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map((v) => keysToSnake(v));
  }

  if (obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [camelToSnake(key)]: keysToSnake(obj[key]),
      }),
      {},
    );
  }

  return obj;
}

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
