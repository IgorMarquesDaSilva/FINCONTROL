const pool = require('../src/config/database');

async function checkDatabase() {
  try {
    const [rows] = await pool.query('SELECT DATABASE() AS database_name, VERSION() AS version');
    console.log(`Conexao realizada com sucesso: ${rows[0].database_name} (MySQL/MariaDB ${rows[0].version}).`);
  } catch (error) {
    console.error(`Falha ao conectar ao banco: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

checkDatabase();
