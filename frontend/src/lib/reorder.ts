export function moveItem<T>(
  items: readonly T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  const result = [...items];
  const outOfRange = fromIndex < 0 || fromIndex >= items.length;
  if (outOfRange || fromIndex === toIndex) return result;

  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}
