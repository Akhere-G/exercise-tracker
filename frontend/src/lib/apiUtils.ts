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
