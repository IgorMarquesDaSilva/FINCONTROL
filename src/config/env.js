const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env'), quiet: true });

function numberFromEnvironment(name, fallback) {
  const value = Number(process.env[name] ?? fallback);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} precisa ser um numero inteiro positivo.`);
  }

  return value;
}

const environment = process.env.NODE_ENV || 'development';

module.exports = Object.freeze({
  environment,
  isProduction: environment === 'production',
  port: numberFromEnvironment('PORT', 3000),
  database: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: numberFromEnvironment('DB_PORT', 3306),
    name: process.env.DB_DATABASE || 'fincontrol',
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'fincontrol-local-troque-esta-chave',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  appBaseUrl: (process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, ''),
  email: {
    host: process.env.SMTP_HOST || '',
    port: numberFromEnvironment('SMTP_PORT', 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'FINCONTROL <no-reply@fincontrol.local>',
  },
});
