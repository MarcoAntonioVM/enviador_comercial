const { DateTime } = require('luxon');

const VALID_DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Normaliza days_week (array o JSON string desde MySQL) a array de claves válidas.
 */
function normalizeDaysWeek(daysWeek) {
  let arr = daysWeek;
  if (typeof daysWeek === 'string') {
    try {
      arr = JSON.parse(daysWeek);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr.filter((d) => typeof d === 'string' && VALID_DAYS.includes(d));
}

/**
 * @param {{ days_week: unknown, hour: string }} preconfig
 * @param {import('luxon').DateTime} nowInZone - DateTime en la zona del scheduler
 */
function isPreconfigurationDue(preconfig, nowInZone) {
  if (!preconfig || !nowInZone || !nowInZone.isValid) return false;
  const weekdayIndex = nowInZone.weekday - 1;
  const dayKey = VALID_DAYS[weekdayIndex];
  const days = normalizeDaysWeek(preconfig.days_week);
  if (!days.includes(dayKey)) return false;
  const hm = nowInZone.toFormat('HH:mm');
  return preconfig.hour === hm;
}

/**
 * Inicio y fin del día calendario en `timeZone` (para consultas sent_at).
 */
function getDayBoundsUtc(timeZone, at = DateTime.now()) {
  const zoned = at.setZone(timeZone);
  const start = zoned.startOf('day').toUTC();
  const end = zoned.endOf('day').toUTC();
  return { start: start.toJSDate(), end: end.toJSDate() };
}

module.exports = {
  VALID_DAYS,
  normalizeDaysWeek,
  isPreconfigurationDue,
  getDayBoundsUtc
};
