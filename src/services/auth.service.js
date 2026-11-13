const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const pool = require('../config/database');
const env = require('../config/env');
const AppError = require('../errors/AppError');
const mailService = require('./mail.service');

const publicUserFields = 'id, name, email, created_at';
const resetTokenLifetimeMinutes = 30;

async function register({ name, email, password }) {
  const [existingUsers] = await pool.execute('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);

  if (existingUsers.length > 0) {
    throw new AppError('Ja existe uma conta com este e-mail.', 409, 'email_in_use', {
      email: 'Este e-mail ja esta cadastrado.',
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash],
    );

    return { id: result.insertId, name, email, session_version: 0 };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new AppError('Ja existe uma conta com este e-mail.', 409, 'email_in_use', {
        email: 'Este e-mail ja esta cadastrado.',
      });
    }

    throw error;
  }
}

async function login({ email, password }) {
  const [users] = await pool.execute(
    `SELECT ${publicUserFields}, password_hash, session_version FROM users WHERE email = ? LIMIT 1`,
    [email],
  );
  const user = users[0];
  const passwordMatches = user ? await bcrypt.compare(password, user.password_hash) : false;

  if (!user || !passwordMatches) {
    throw new AppError('E-mail ou senha incorretos.', 401, 'invalid_credentials');
  }

  delete user.password_hash;
  return user;
}

async function findUserById(id) {
  const [users] = await pool.execute(
    `SELECT ${publicUserFields}, session_version FROM users WHERE id = ? LIMIT 1`,
    [id],
  );

  return users[0] || null;
}

async function requestPasswordReset(email) {
  const connection = await pool.getConnection();
  let resetRequest;
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  try {
    await connection.beginTransaction();
    const [users] = await connection.execute('SELECT id, email FROM users WHERE email = ? LIMIT 1 FOR UPDATE', [email]);
    if (users.length) {
      const user = users[0];
      await connection.execute(
        'UPDATE password_reset_tokens SET used_at = UTC_TIMESTAMP() WHERE user_id = ? AND used_at IS NULL',
        [user.id],
      );
      await connection.execute(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES (?, ?, DATE_ADD(UTC_TIMESTAMP(), INTERVAL ${resetTokenLifetimeMinutes} MINUTE))`,
        [user.id, tokenHash],
      );
      resetRequest = { email: user.email, resetUrl: `${env.appBaseUrl}/?resetToken=${rawToken}` };
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return resetRequest || null;
}

async function deliverPasswordReset(resetRequest) {
  if (!resetRequest) return;
  try {
    await mailService.sendPasswordReset(resetRequest);
  } catch (error) {
    console.error('Não foi possível enviar o link de recuperação de senha.', error);
  }
}

async function resetPassword({ token, password }) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const passwordHash = await bcrypt.hash(password, 12);
  const connection = await pool.getConnection();
  let userId;

  try {
    await connection.beginTransaction();
    const [tokens] = await connection.execute(
      `SELECT id, user_id FROM password_reset_tokens
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP()
       LIMIT 1 FOR UPDATE`,
      [tokenHash],
    );
    if (!tokens.length) {
      throw new AppError('O link de recuperação é inválido ou expirou. Solicite um novo link.', 400, 'invalid_reset_token');
    }

    userId = tokens[0].user_id;
    await connection.execute(
      'UPDATE users SET password_hash = ?, session_version = session_version + 1 WHERE id = ?',
      [passwordHash, userId],
    );
    await connection.execute(
      'UPDATE password_reset_tokens SET used_at = UTC_TIMESTAMP() WHERE user_id = ? AND used_at IS NULL',
      [userId],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function changePassword(userId, { currentPassword, password }) {
  const [users] = await pool.execute(
    'SELECT password_hash FROM users WHERE id = ? LIMIT 1',
    [userId],
  );
  const user = users[0];
  if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
    throw new AppError('A senha atual está incorreta.', 401, 'invalid_current_password', {
      currentPassword: 'Confira sua senha atual.',
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [result] = await pool.execute(
    `UPDATE users SET password_hash = ?, session_version = session_version + 1
     WHERE id = ? AND password_hash = ?`,
    [passwordHash, userId, user.password_hash],
  );
  if (!result.affectedRows) {
    throw new AppError('A senha foi alterada em outra sessão. Entre novamente.', 409, 'password_changed');
  }

  return findUserById(userId);
}

function createToken(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email, sv: Number(user.session_version || 0) },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn, issuer: 'fincontrol' },
  );
}

function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret, { issuer: 'fincontrol' });
}

module.exports = {
  register,
  login,
  findUserById,
  requestPasswordReset,
  deliverPasswordReset,
  resetPassword,
  changePassword,
  createToken,
  verifyToken,
};
