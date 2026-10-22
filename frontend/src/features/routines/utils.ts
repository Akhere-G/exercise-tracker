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
