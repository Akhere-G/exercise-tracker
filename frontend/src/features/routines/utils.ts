export const getDayStr = (day: number) => {
  switch (day) {
    case 0:
      return "Monday";
    case 1:
      return "Tuesday";
    case 2:
      return "Wednesday";
    case 3:
      return "Thursday";
    case 4:
      return "Friday";
    case 5:
      return "Saturday";
    case 6:
      return "Sunday";
  }
};

const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;

const pad = (value: number) => value.toString().padStart(2, "0");

const shiftWeekTime = (day: number, time: string, offsetMinutes: number) => {
  const [hours, minutes] = time.split(":").slice(0, 2).map(Number);
  const total =
    (((day * MINUTES_PER_DAY + hours * 60 + minutes + offsetMinutes) %
      MINUTES_PER_WEEK) +
      MINUTES_PER_WEEK) %
    MINUTES_PER_WEEK;
  const minuteOfDay = total % MINUTES_PER_DAY;

  return {
    day: Math.floor(total / MINUTES_PER_DAY),
    time: `${pad(Math.floor(minuteOfDay / 60))}:${pad(minuteOfDay % 60)}`,
  };
};

export const toUtcSchedule = (day: number, time: string) => {
  const utc = shiftWeekTime(day, time, new Date().getTimezoneOffset());
  return { day: utc.day, startTime: `${utc.time}:00Z` };
};

export const toLocalSchedule = (day: number, startTime: string) =>
  shiftWeekTime(day, startTime, -new Date().getTimezoneOffset());

type SupersetGroups = (number | null | undefined)[];

/**
 * Links the exercise at `index` with the next one, or unlinks them when they
 * are already linked. Exercises that end up alone in a group are cleared.
 */
export function toggleSupersetLink(
  groups: SupersetGroups,
  index: number,
): (number | null)[] {
  const result = groups.map((g) => g ?? null);
  if (index < 0 || index + 1 >= groups.length) return result;

  const current = groups[index] ?? null;
  const next = groups[index + 1] ?? null;
  const newGroupId = Math.max(0, ...groups.map((g) => g ?? 0)) + 1;

  if (current !== null && current === next) {
    const tail: number[] = [];
    for (let i = index + 1; i < groups.length && groups[i] === current; i++) {
      tail.push(i);
    }
    tail.forEach((i) => {
      result[i] = tail.length > 1 ? newGroupId : null;
    });

    const headCount = groups.filter((g, i) => g === current && i <= index)
      .length;
    if (headCount === 1) result[index] = null;
    return result;
  }

  const group = current ?? next ?? newGroupId;
  if (next !== null) {
    groups.forEach((g, i) => {
      if (g === next) result[i] = group;
    });
  }
  result[index] = group;
  result[index + 1] = group;
  return result;
}
