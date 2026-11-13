const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../src/app');
const pool = require('../src/config/database');

test('CSV e PDF exportam somente dados autenticados com filtros e preferências', async () => {
  const server = await new Promise((resolve) => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const emails = [`export-a-${Date.now()}@fincontrol.local`, `export-b-${Date.now()}@fincontrol.local`];
  const register = async (email) => {
    const response = await fetch(`${base}/api/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Pessoa Exportação', email, password: 'SenhaTeste123', passwordConfirmation: 'SenhaTeste123' }),
    });
    assert.equal(response.status, 201);
    return { id: (await response.json()).user.id, cookie: response.headers.get('set-cookie').split(';')[0] };
  };
  try {
    const first = await register(emails[0]);
    const second = await register(emails[1]);
    const profileUpdate = await fetch(`${base}/api/profile`, {
      method: 'PUT', headers: { Cookie: first.cookie, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Pessoa Exportação', email: emails[0], currency: 'USD',
        dateFormat: 'MM/DD/YYYY', timeZone: 'America/Sao_Paulo', monthStartDay: 1 }),
    });
    assert.equal(profileUpdate.status, 200);
    const [categoryA] = await pool.execute(
      "INSERT INTO categories (user_id, name, type) VALUES (?, 'Moradia', 'EXPENSE')", [first.id],
    );
    const [categoryB] = await pool.execute(
      "INSERT INTO categories (user_id, name, type) VALUES (?, 'Privado', 'EXPENSE')", [second.id],
    );
    await pool.execute(
      `INSERT INTO transactions (user_id, category_id, type, description, amount, transaction_date)
       VALUES (?, ?, 'EXPENSE', 'Aluguel', 125.50, '2026-11-13'),
              (?, ?, 'EXPENSE', 'Segredo de outro usuário', 999, '2026-11-13')`,
      [first.id, categoryA.insertId, second.id, categoryB.insertId],
    );

    const anonymous = await fetch(`${base}/api/exports/transactions.csv`);
    assert.equal(anonymous.status, 401);
    const csvResponse = await fetch(`${base}/api/exports/transactions.csv?type=EXPENSE&dateFrom=2026-11-01&dateTo=2026-11-30`, {
      headers: { Cookie: first.cookie },
    });
    assert.equal(csvResponse.status, 200);
    assert.match(csvResponse.headers.get('content-type'), /text\/csv/);
    assert.equal(csvResponse.headers.get('cache-control'), 'no-store');
    const csv = await csvResponse.text();
    assert.match(csv, /"11\/13\/2026"/);
    assert.match(csv, /US\$\s125,50|\$\s125,50/);
    assert.match(csv, /Aluguel/);
    assert.doesNotMatch(csv, /Segredo de outro usuário/);
    const filtered = await fetch(`${base}/api/exports/transactions.csv?search=ausente`, {
      headers: { Cookie: first.cookie },
    });
    assert.equal((await filtered.text()).trim().split('\n').length, 1);

    const pdfResponse = await fetch(`${base}/api/exports/monthly.pdf?month=2026-11`, {
      headers: { Cookie: first.cookie },
    });
    assert.equal(pdfResponse.status, 200);
    assert.equal(pdfResponse.headers.get('content-type'), 'application/pdf');
    assert.equal(pdfResponse.headers.get('cache-control'), 'no-store');
    const pdf = Buffer.from(await pdfResponse.arrayBuffer());
    assert.ok(pdf.subarray(0, 4).equals(Buffer.from('%PDF')));
    assert.ok(pdf.length > 2000);
    assert.equal((await fetch(`${base}/api/exports/monthly.pdf?month=invalid`, { headers: { Cookie: first.cookie } })).status, 400);
  } finally {
    await pool.execute('DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE email IN (?, ?))', emails);
    await pool.execute('DELETE FROM users WHERE email IN (?, ?)', emails);
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await pool.end();
  }
});
