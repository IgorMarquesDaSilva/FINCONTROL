const app = require('./src/app');
const env = require('./src/config/env');
const pool = require('./src/config/database');
const recurrenceService = require('./src/services/recurrence.service');

const server = app.listen(env.port, () => {
  console.log(`FINCONTROL disponivel em http://localhost:${env.port}`);
});
const recurrenceTimer = setInterval(() => {
  recurrenceService.generateDueForAllUsers().catch((error) => {
    console.error('Falha ao atualizar movimentações recorrentes.', error);
  });
}, 15 * 60 * 1000);
recurrenceTimer.unref();
recurrenceService.generateDueForAllUsers().catch((error) => {
  console.error('Falha ao atualizar movimentações recorrentes.', error);
});

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
