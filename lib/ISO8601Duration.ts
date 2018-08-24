/**
 * @description A module for parsing ISO8601 durations
 * @author Tobias Lunding (original)
 * @author Adam Schønemann
 * I've adapted it to typescript. Could not use as dependency as downstream
 * deps would not include the typescript defs.
 */

export interface Duration {
  years: number,
  months: number,
  days: number,
  hours: number,
  minutes: number,
  seconds: number
}
/**
 * The pattern used for parsing ISO8601 duration (PnYnMnDTnHnMnS).
 * This does not cover the week format PnW.
 */

// PnYnMnDTnHnMnS
const numbers = '\\d+(?:[\\.,]\\d{0,12})?'
const datePattern = `(${numbers}Y)?(${numbers}M)?(${numbers}D)?`
const timePattern = `T(${numbers}H)?(${numbers}M)?(${numbers}S)?`

const iso8601 = `P(?:${datePattern}(?:${timePattern})?)`
const objMap:Array<keyof Duration> = ['years', 'months', 'days', 'hours', 'minutes', 'seconds']

/**
 * The ISO8601 regex for matching / testing durations
 */
export const pattern = new RegExp(iso8601)

/** Parse PnYnMnDTnHnMnS format to object
 * @param  durationString - PnYnMnDTnHnMnS formatted string
 * @return With a property for each part of the pattern
 */
export const parse = (durationString: string): Duration => {
  // Slice away first entry in match-array
  return (durationString.match(pattern) || []).slice(1).reduce((prev, next, idx) => {
    prev[objMap[idx]] = parseFloat(next) || 0
    return prev
  }, {} as Duration)
}

/**
 * Convert ISO8601 duration object to an end Date.
 *
 * @param  duration - The duration object
 * @param  startDate - The starting Date for calculating the duration
 * @return The resulting end Date
 */
export const end = (duration: Duration, startDate: Date): Date => {
  // Create two equal timestamps, add duration to 'then' and return time difference
  const timestamp = (startDate ? startDate.getTime() : Date.now())
  const then = new Date(timestamp)

  then.setFullYear(then.getFullYear() + duration.years)
  then.setMonth(then.getMonth() + duration.months)
  then.setDate(then.getDate() + duration.days)
  then.setHours(then.getHours() + duration.hours)
  then.setMinutes(then.getMinutes() + duration.minutes)
  // Then.setSeconds(then.getSeconds() + duration.seconds);
  then.setMilliseconds(then.getMilliseconds() + (duration.seconds * 1000))

  return then
}

/**
 * Convert ISO8601 duration object to seconds
 * Caution: Uses year = 365 days, month = 30 days
 * @param  duration - The duration object
 * @return 
 */
export const toSeconds = (duration: Duration): number => {
  const { years, months, days, hours, minutes, seconds } = duration;
  const minScale = 60, hourScale = minScale * 60, dayScale = hourScale * 24,
        monthScale = dayScale * 30, yearScale = dayScale * 365;
  return (
      years * yearScale 
    + months * monthScale 
    + days * dayScale 
    + hours * hourScale
    + minutes * minScale
    + seconds
  )

}

/**
 * Takes a Duration object and turns into an ISO8601 duration string, e.g.
 * P1DT2H33M15.0001S (1 day, 2 hours, 33 minutes, 15.0001 seconds)
 * @param d 
 */
export const durationToISOString = (d: Duration): string => {
  const fmt = (f: string) => (x: number) => x != 0 ? x.toString() + f : "";
  const { years, months, days, hours, minutes, seconds } = d;
  const datestr = fmt("Y")(years) + fmt("M")(months) + fmt("D")(days)
  const timestr = fmt("H")(hours) + fmt("M")(minutes) + fmt("S")(seconds)
  const ret = datestr + (timestr.length > 0 ? "T" + timestr : "") 
  return "P" + (ret.length > 0 ? ret : "0S")
}