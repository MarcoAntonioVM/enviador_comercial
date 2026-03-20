const cron = require('node-cron');
const { DateTime } = require('luxon');
const log = require('../utils/logger');
const preconfigurationService = require('../services/preconfiguration.service');
const emailSendService = require('../services/emailSend.service');
const { isPreconfigurationDue } = require('../utils/preconfigurationSchedule');

let task = null;

function getSchedulerConfig() {
  const enabled = process.env.ENABLE_PRECONFIG_SCHEDULER === 'true';
  const timezone = process.env.SCHEDULER_TIMEZONE || 'UTC';
  return { enabled, timezone };
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
  getSchedulerConfig
};
