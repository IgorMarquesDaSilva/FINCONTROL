const app = require('./src/app');
const env = require('./src/config/env');
const pool = require('./src/config/database');
const recurrenceService = require('./src/services/recurrence.service');
const notificationService = require('./src/services/notification.service');

const server = app.listen(env.port, () => {
  console.log(`FINCONTROL disponivel em http://localhost:${env.port}`);
});
async function updateScheduledWork() {
  try {
    await recurrenceService.generateDueForAllUsers();
    await notificationService.generateForAllUsers();
  } catch (error) {
    console.error('Falha ao atualizar lançamentos e avisos programados.', error);
  }
}
const recurrenceTimer = setInterval(() => { void updateScheduledWork(); }, 15 * 60 * 1000);
recurrenceTimer.unref();
void updateScheduledWork();

async function shutdown(signal) {
  clearInterval(recurrenceTimer);
  console.log(`\n${signal} recebido. Encerrando...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
