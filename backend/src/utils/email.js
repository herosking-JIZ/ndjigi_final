const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

async function sendResetPasswordEmail(email, prenom, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  await transporter.sendMail({
    from:    `"N'DJIGI" <${process.env.SMTP_USER}>`,
    to:      email,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <h2>Bonjour ${prenom},</h2>
      <p>Vous avez demandé à réinitialiser votre mot de passe.</p>
      <p>Cliquez sur le lien ci-dessous (valable <strong>15 minutes</strong>) :</p>
      <a href="${resetUrl}" style="
        background:#4F46E5;
        color:white;
        padding:12px 24px;
        border-radius:6px;
        text-decoration:none;
        display:inline-block;
        margin:16px 0;
      ">Réinitialiser mon mot de passe</a>
      <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
      <p>Ce lien expirera dans 15 minutes.</p>
    `
  });
}

module.exports = { sendResetPasswordEmail };