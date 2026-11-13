const nodemailer = require('nodemailer');
const env = require('../config/env');

function createTransport() {
  if (!env.email.host) return null;
  const options = {
    host: env.email.host,
    port: env.email.port,
    secure: env.email.secure,
  };
  if (env.email.user || env.email.password) {
    options.auth = { user: env.email.user, pass: env.email.password };
  }
  return nodemailer.createTransport(options);
}

async function sendPasswordReset({ email, resetUrl }) {
  const transport = createTransport();
  if (!transport) {
    if (env.isProduction) throw new Error('SMTP não foi configurado para envio de recuperação.');
    console.info(`[FINCONTROL dev] Link temporário de recuperação: ${resetUrl}`);
    return;
  }

  const safeResetUrl = resetUrl.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
  await transport.sendMail({
    from: env.email.from,
    to: email,
    subject: 'Redefinição de senha do FINCONTROL',
    text: `Recebemos uma solicitação para redefinir sua senha. O link expira em 30 minutos e só pode ser usado uma vez:\n\n${resetUrl}\n\nSe você não fez essa solicitação, ignore esta mensagem.`,
    html: `<p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${safeResetUrl}">Definir nova senha</a></p><p>O link expira em 30 minutos e só pode ser usado uma vez. Se você não fez essa solicitação, ignore esta mensagem.</p>`,
  });
}

module.exports = { sendPasswordReset };
