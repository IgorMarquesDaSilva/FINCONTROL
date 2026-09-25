const app = require('./src/app');
const env = require('./src/config/env');
const pool = require('./src/config/database');

const server = app.listen(env.port, () => {
  console.log(`FINCONTROL disponivel em http://localhost:${env.port}`);
});

async function shutdown(signal) {
  console.log(`\n${signal} recebido. Encerrando...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
