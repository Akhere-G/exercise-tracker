/** Identifies the week (starting Monday) a date falls in, e.g. "2026-11-02". */
export const weekKey = (date: Date) => {
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
};
