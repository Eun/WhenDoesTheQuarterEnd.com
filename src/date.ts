
export type DayOfWeek = number

export const DaySunday: DayOfWeek = 0;
export const DayMonday: DayOfWeek = 1;
export const DayTuesday: DayOfWeek = 2;
export const DayWednesday: DayOfWeek = 3;
export const DayThursday: DayOfWeek = 4;
export const DayFriday: DayOfWeek = 5;
export const DaySaturday: DayOfWeek = 6;


export function countDaysInQuarter(quarterStartDate: Date, quarterEndDate: Date, workDays: DayOfWeek[]): {
  amountOfWorkDays: number;
  totalAmountOfDays: number
} {
  // Use a Set for faster lookups, which is good practice if `workDays` were very large.
  const workDaysSet = new Set(workDays);
  let amountOfWorkDays = 0;
  let totalAmountOfDays = 0;
  let currentDate = new Date(quarterStartDate.getTime());
  // Loop from the start date until the end of the quarter.
  while (currentDate <= quarterEndDate) {
    // Check if the current day of the week is in our set of workdays.
    if (workDaysSet.has(currentDate.getDay())) {
      amountOfWorkDays++;
    }
    totalAmountOfDays++;
    // Advance to the next day. The setDate method correctly handles month and year rollovers.
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {amountOfWorkDays: amountOfWorkDays, totalAmountOfDays: totalAmountOfDays};
}

export function getQuarterInfo(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed (0 = January, 11 = December)

  let quarterStartDate: Date;
  let quarterEndDate: Date;
  let quarter: number;

  if (month >= 0 && month <= 2) { // Q1: Jan, Feb, Mar
    quarterStartDate = new Date(year, 0, 1);
    quarterEndDate = new Date(year, 3, 1);
    quarter = 1;
  } else if (month >= 3 && month <= 5) { // Q2: Apr, May, Jun
    quarterStartDate = new Date(year, 3, 1);
    quarterEndDate = new Date(year, 6, 1);
    quarter = 2;
  } else if (month >= 6 && month <= 8) { // Q3: Jul, Aug, Sep
    quarterStartDate = new Date(year, 6, 1);
    quarterEndDate = new Date(year, 9, 1);
    quarter = 3;
  } else { // Q4: Oct, Nov, Dec
    quarterStartDate = new Date(year, 9, 1);
    quarterEndDate = new Date(year, 11, 31, 23, 59, 59, 999); // End of December
    quarter = 4;
  }
  return { year, quarter, quarterStartDate, quarterEndDate };
}


export function getAbsoluteDayNumber(date: Date): number {
  // Get the absolute day number since the start of this year
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const diffTime = date.getTime() - firstDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // +1 to make it 1-indexed
}
