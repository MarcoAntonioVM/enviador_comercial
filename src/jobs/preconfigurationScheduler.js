const cron = require('node-cron');
const { DateTime } = require('luxon');
const log = require('../utils/logger');
const preconfigurationService = require('../services/preconfiguration.service');
const emailSendService = require('../services/emailSend.service');
const { isPreconfigurationDue, isPreconfigurationMissed } = require('../utils/preconfigurationSchedule');

let task = null;

function getSchedulerConfig() {
  const enabled = process.env.ENABLE_PRECONFIG_SCHEDULER === 'true';
  const timezone = process.env.SCHEDULER_TIMEZONE || 'UTC';
  return { enabled, timezone };
}

/**
 * Recupera envíos perdidos mientras el servidor estuvo caído.
 */
async function runCatchupSends() {
  const { enabled, timezone } = getSchedulerConfig();
  if (!enabled) return;
  const now = DateTime.now().setZone(timezone);
  let list;
  try {
    list = await preconfigurationService.findAllActiveForScheduler();
  } catch (err) {
    log.error('Catchup: failed to load preconfigurations', err);
    return;
  }
  for (const row of list) {
    const plain = typeof row.get === 'function' ? row.get({ plain: true }) : row;
    if (!isPreconfigurationMissed(plain, now)) continue;
    try {
      const result = await emailSendService.executeScheduledPreconfiguration(plain.id, timezone);
      if (result.skipped) {
        log.info(`Catchup: preconfiguration ${plain.id} skipped (${result.reason})`);
      } else {
        log.info(`Catchup: preconfiguration ${plain.id} recovered and sent`);
      }
    } catch (err) {
      log.error(`Catchup: preconfiguration ${plain.id} error`, err);
    }
  }
}

function startPreconfigurationScheduler() {
  const { enabled, timezone } = getSchedulerConfig();
  if (!enabled) {
    log.info('Preconfiguration scheduler disabled (set ENABLE_PRECONFIG_SCHEDULER=true to enable)');
    return;
  }
  if (task) {
    log.warn('Preconfiguration scheduler already running');
    return;
  }

  // Al arrancar, recuperar envíos que se perdieron mientras el servidor estuvo caído
  runCatchupSends().catch((err) => log.error('Catchup: unexpected error', err));

  task = cron.schedule(
    '* * * * *',
    async () => {
      const now = DateTime.now().setZone(timezone);
      let list;
      try {
        list = await preconfigurationService.findAllActiveForScheduler();
      } catch (err) {
        log.error('Scheduler: failed to load preconfigurations', err);
        return;
      }

      for (const row of list) {
        const plain = typeof row.get === 'function' ? row.get({ plain: true }) : row;
        if (!isPreconfigurationDue(plain, now)) continue;
        try {
          const result = await emailSendService.executeScheduledPreconfiguration(plain.id, timezone);
          if (result.skipped) {
            log.debug(`Scheduler: preconfiguration ${plain.id} skipped (${result.reason})`);
          } else {
            log.info(`Scheduler: preconfiguration ${plain.id} sent`);
          }
        } catch (err) {
          log.error(`Scheduler: preconfiguration ${plain.id} error`, err);
        }
      }
    },
    { timezone, noOverlap: true, name: 'preconfiguration-send' }
  );

  log.info(`Preconfiguration scheduler started (timezone=${timezone})`);
}

async function stopPreconfigurationScheduler() {
  if (!task) return;
  await task.stop();
  if (typeof task.destroy === 'function') {
    task.destroy();
  }
  task = null;
  log.info('Preconfiguration scheduler stopped');
}

module.exports = {
  startPreconfigurationScheduler,
  stopPreconfigurationScheduler,
  getSchedulerConfig,
  runCatchupSends
};
