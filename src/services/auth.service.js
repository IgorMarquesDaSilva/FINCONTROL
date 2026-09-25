const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const env = require('../config/env');
const AppError = require('../errors/AppError');

const publicUserFields = 'id, name, email, created_at';

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

    return { id: result.insertId, name, email };
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
    `SELECT ${publicUserFields}, password_hash FROM users WHERE email = ? LIMIT 1`,
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
    `SELECT ${publicUserFields} FROM users WHERE id = ? LIMIT 1`,
    [id],
  );

  return users[0] || null;
}

function createToken(user) {
  return jwt.sign(
    { sub: String(user.id), email: user.email },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn, issuer: 'fincontrol' },
  );
}

function verifyToken(token) {
  return jwt.verify(token, env.jwt.secret, { issuer: 'fincontrol' });
}

module.exports = { register, login, findUserById, createToken, verifyToken };
