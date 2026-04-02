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
 * Devuelve true si la preconfiguración debería haberse ejecutado hoy pero
 * la ventana de 5 min ya pasó (la hora programada está en el pasado).
 * Útil para el catchup al reiniciar el servidor.
 */
function isPreconfigurationMissed(preconfig, nowInZone) {
  if (!preconfig || !nowInZone || !nowInZone.isValid) return false;
  const weekdayIndex = nowInZone.weekday - 1;
  const dayKey = VALID_DAYS[weekdayIndex];
  const days = normalizeDaysWeek(preconfig.days_week);
  if (!days.includes(dayKey)) return false;
  if (!preconfig.hour || !/^\d{2}:\d{2}$/.test(preconfig.hour)) return false;
  const [h, m] = preconfig.hour.split(':').map(Number);
  const scheduledTime = nowInZone.set({ hour: h, minute: m, second: 0, millisecond: 0 });
  const diffMinutes = nowInZone.diff(scheduledTime, 'minutes').minutes;
  return diffMinutes > 5;
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
  isPreconfigurationMissed,
  getDayBoundsUtc
};
