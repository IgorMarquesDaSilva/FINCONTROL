const app = require('./app');
const env = require('./config/env');
const pool = require('./config/database');

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
