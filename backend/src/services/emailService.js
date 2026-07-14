/**
 * EMAIL SERVICE
 * Handles transactional emails with HTML + TXT fallback
 * Uses nodemailer + handlebars templates
 */

const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Handlebars implementation (simple)
function renderTemplate(templateString, data) {
  return templateString
    .replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
      return data[condition] ? content : '';
    })
    .replace(/{{{(\w+)}}}/g, (match, key) => data[key] || '')
    .replace(/{{(\w+)}}/g, (match, key) => data[key] || '');
}

function getSupportWhatsapp() {
  return process.env.SUPPORT_WHATSAPP || '+22606768989';
}

function getSupportWhatsappNumber() {
  return getSupportWhatsapp().replace(/\D/g, '');
}

function buildSupportWhatsappLink() {
  return `https://wa.me/${getSupportWhatsappNumber()}?text=Bonjour%20N'DJIGI`;
}

function formatChangedAt(changedAt) {
  const date = changedAt instanceof Date ? changedAt : new Date(changedAt);
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'UTC'
  }) + ' UTC';
}

function simplifyUserAgent(userAgent) {
  if (!userAgent) return 'Inconnu';
  if (userAgent.includes('Chrome')) return 'Navigateur Chrome';
  if (userAgent.includes('Firefox')) return 'Navigateur Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Navigateur Safari';
  if (userAgent.includes('Edg')) return 'Navigateur Edge';
  if (userAgent.includes('Mobile')) return 'Appareil mobile';
  return userAgent.slice(0, 120);
}

// Initialize nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_PORT == 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('⚠️ Email service error:', error.message);
  } else {
    console.log('✅ Email service ready');
  }
});

const EmailService = {
  /**
   * Send gestionnaire welcome email
   * @param {string} email - Recipient email
   * @param {Object} data - Template data
   *   - nom: string
   *   - prenom: string
   *   - email: string
   *   - tempPassword: string
   *   - parkings: Array<{nom, adresse}>
   */
  async sendGestionnaireWelcome(email, data) {
    try {
      // Load templates
      const txtPath = path.join(__dirname, 'emails/templates/gestionnaire-welcome.txt');
      const htmlPath = path.join(__dirname, 'emails/templates/gestionnaire-welcome.html');

      const txtTemplate = fs.readFileSync(txtPath, 'utf-8');
      const htmlTemplate = fs.readFileSync(htmlPath, 'utf-8');

      // Prepare data
      const templateData = {
        prenom: data.prenom,
        nom: data.nom,
        email: data.email,
        tempPassword: data.tempPassword,
        appUrl: process.env.APP_URL || 'http://localhost:3000',
        supportWhatsapp: process.env.SUPPORT_WHATSAPP || '+22606768989',
        supportWhatsappNumber: (process.env.SUPPORT_WHATSAPP || '+22606768989').replace(/\D/g, ''),
        parkingsList: data.parkings
          .map(p => `   • ${p.nom} (${p.adresse})`)
          .join('\n'),
      };

      // Render templates
      const textContent = renderTemplate(txtTemplate, templateData);
      const htmlContent = renderTemplate(htmlTemplate, templateData);

      // Send email
      const result = await transporter.sendMail({
        from: `N'DJIGI <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Bienvenue sur N\'DJIGI - Votre compte gestionnaire',
        text: textContent,
        html: htmlContent,
      });

      console.log(`✅ Gestionnaire welcome email sent to ${email}`);
      return result;
    } catch (error) {
      console.error('❌ Email send error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  },

  /**
   * Send user invitation email (generic for all roles)
   * @param {string} email - Recipient email
   * @param {Object} data - Template data
   *   - nom: string
   *   - prenom: string
   *   - role: string
   *   - tempPassword: string
   *   - appUrl: string
   */
  async sendUserInvitation(email, data) {
    try {
      const appUrl = data.appUrl || process.env.APP_URL || 'http://localhost:3000';
      const roleLabels = {
        'admin': 'Administrateur',
        'gestionnaire': 'Gestionnaire de Parking',
        'passager': 'Passager',
        'chauffeur': 'Chauffeur',
        'proprietaire': 'Propriétaire'
      };

      const roleLabel = roleLabels[data.role] || data.role;
      const parkingInfo = data.parkingName ? `\n\nParking assigné: ${data.parkingName}` : '';

      // Build activation link with token (if provided)
      const activationLink = data.token
        ? `${appUrl}/auth/first-connection?token=${data.token}`
        : null;

      const subject = `Activation du compte N'DJIGI - Compte ${roleLabel}`;

      const textContent = `
Bienvenue sur N'DJIGI!

Bonjour ${data.prenom} ${data.nom},

Votre compte ${roleLabel} a été créé avec succès.

Email: ${email}
Rôle: ${roleLabel}${parkingInfo}

═══════════════════════════════════════════════════════════════
POUR ACTIVER VOTRE COMPTE
═══════════════════════════════════════════════════════════════

Veuillez cliquer sur le lien ci-dessous pour activer votre compte et définir votre mot de passe:

${activationLink}

Ce lien expire dans 24 heures.

═══════════════════════════════════════════════════════════════

Si vous ne pouvez pas cliquer sur le lien, copiez-collez l'adresse ci-dessus dans votre navigateur.

Support: +226 06 76 98 89 (WhatsApp)

Cordialement,
L'équipe N'DJIGI
`;

      const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activation - N'DJIGI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .content { padding: 30px; }
    .section { margin-bottom: 25px; }
    .section h2 { font-size: 16px; color: #1e3c72; margin-bottom: 12px; font-weight: 600; }
    .info-box { background-color: #f9f9f9; border-left: 4px solid #2a5298; padding: 15px; border-radius: 4px; font-size: 14px; }
    .info-box p { margin-bottom: 10px; }
    .cta-button { display: inline-block; background-color: #2a5298; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .cta-button:hover { background-color: #1e3c72; }
    .expiration-notice { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 4px; font-size: 14px; color: #856404; }
    .footer { background-color: #f5f5f5; padding: 20px 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
    @media (max-width: 600px) {
      .container { margin: 0; border-radius: 0; }
      .content { padding: 20px 15px; }
      .cta-button { padding: 12px 30px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Activation de compte</h1>
      <p>Bienvenue sur N'DJIGI!</p>
    </div>
    <div class="content">
      <p>Bonjour <strong>${data.prenom} ${data.nom}</strong>,</p>
      <p style="margin-top: 15px; margin-bottom: 20px;">Votre compte <strong>${roleLabel}</strong> a été créé avec succès. Pour l'activer et commencer à l'utiliser, veuillez cliquer sur le bouton ci-dessous.</p>

      <div class="section">
        <h2>📋 VOS INFORMATIONS</h2>
        <div class="info-box">
          <p><strong>Email :</strong> ${email}</p>
          <p><strong>Rôle :</strong> ${roleLabel}</p>
          ${data.parkingName ? `<p><strong>Parking assigné :</strong> ${data.parkingName}</p>` : ''}
        </div>
      </div>

      <div class="section">
        <h2>🔐 ACTIVER VOTRE COMPTE</h2>
        <p>Cliquez sur le bouton ci-dessous pour accéder à la page d'activation :</p>
        <center>
          <a href="${activationLink}" class="cta-button">Activer mon compte</a>
        </center>
        <p style="margin-top: 15px; font-size: 14px;">Ou copiez-collez ce lien dans votre navigateur :<br><code style="background: #f5f5f5; padding: 8px; display: block; word-break: break-all; margin-top: 10px;">${activationLink}</code></p>
      </div>

      <div class="expiration-notice">
        <strong>⏰ Rappel important :</strong> Ce lien d'activation expire dans 24 heures. Après cela, vous devrez demander un nouveau lien.
      </div>

      <div class="section">
        <h2>📱 Besoin d'aide?</h2>
        <p>Contactez-nous sur WhatsApp: <a href="https://wa.me/22606768989?text=Bonjour%20N'DJIGI" style="color: #2a5298;">+226 06 76 98 89</a></p>
      </div>

      <div style="margin-top: 30px; text-align: center; color: #555;">
        <p><strong>À très vite sur N'DJIGI!</strong></p>
        <p style="margin-top: 8px; font-size: 14px;">L'équipe N'DJIGI</p>
      </div>
    </div>

    <div class="footer">
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
      <p>© 2026 N'DJIGI. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
`;

      const result = await transporter.sendMail({
        from: `N'DJIGI <${process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        text: textContent,
        html: htmlContent,
      });

      console.log(`✅ User invitation email sent to ${email} (${data.role})`);
      return result;
    } catch (error) {
      console.error('❌ Invitation email send error:', error);
      throw new Error(`Failed to send invitation email: ${error.message}`);
    }
  },

  /**
   * Send gestionnaire welcome email with temporary password
   * @param {string} email - Recipient email
   * @param {Object} data - Template data
   *   - nom: string
   *   - prenom: string
   *   - email: string
   *   - parking_nom: string
   *   - tempPassword: string
   */
  async sendGestionnaireInvitation(email, data) {
    try {
      const appUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000'
      const supportWhatsapp = process.env.SUPPORT_WHATSAPP || '+22606768989'
      const supportNumber = supportWhatsapp.replace(/\D/g, '')

      const textContent = `
Bienvenue sur N'DJIGI - Gestionnaire de Parking!

Bonjour ${data.prenom} ${data.nom},

Un compte gestionnaire de parking vient d'être créé pour vous par l'administrateur.

═══════════════════════════════════════════════════════════════
VOS IDENTIFIANTS
═══════════════════════════════════════════════════════════════

Email: ${email}
Mot de passe provisoire: ${data.tempPassword}
Parking assigné: ${data.parking_nom}

═══════════════════════════════════════════════════════════════
⚠️ IMPORTANT
═══════════════════════════════════════════════════════════════

Ce mot de passe ne fonctionnera qu'une seule fois.
Vous devrez en choisir un nouveau dès votre première connexion.

═══════════════════════════════════════════════════════════════
POUR VOTRE PREMIÈRE CONNEXION
═══════════════════════════════════════════════════════════════

1. Rendez-vous sur ${appUrl}/login
2. Connectez-vous avec vos identifiants ci-dessus
3. Choisissez votre nouveau mot de passe personnel
4. Vous pourrez ensuite accéder à votre espace de gestion

═══════════════════════════════════════════════════════════════

Support: ${supportWhatsapp} (WhatsApp)

Cordialement,
L'équipe N'DJIGI
`

      const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue - N'DJIGI</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 40px 20px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .content { padding: 30px; }
    .section { margin-bottom: 25px; }
    .section h2 { font-size: 16px; color: #1e3c72; margin-bottom: 12px; font-weight: 600; }
    .credentials-box { background-color: #f9f9f9; border-left: 4px solid #2a5298; padding: 15px; border-radius: 4px; font-size: 14px; font-family: 'Courier New', monospace; }
    .credentials-box p { margin-bottom: 10px; }
    .credentials-box strong { color: #1e3c72; }
    .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 4px; font-size: 14px; }
    .steps { list-style: none; padding: 0; }
    .steps li { padding: 10px 0; padding-left: 30px; position: relative; font-size: 14px; }
    .steps li:before { content: "✓"; position: absolute; left: 0; color: #2a5298; font-weight: bold; }
    .cta-button { display: inline-block; background-color: #2a5298; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .cta-button:hover { background-color: #1e3c72; }
    .footer { background-color: #f5f5f5; padding: 20px 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
    @media (max-width: 600px) {
      .container { margin: 0; border-radius: 0; }
      .content { padding: 20px 15px; }
      .cta-button { padding: 12px 30px; font-size: 14px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bienvenue sur N'DJIGI</h1>
      <p>Votre compte gestionnaire de parking</p>
    </div>
    <div class="content">
      <p>Bonjour <strong>${data.prenom} ${data.nom}</strong>,</p>
      <p style="margin-top: 15px; margin-bottom: 20px;">Bienvenue sur N'DJIGI ! Un compte gestionnaire de parking vient d'être créé pour vous par l'administrateur.</p>

      <div class="section">
        <h2>📋 VOS IDENTIFIANTS</h2>
        <div class="credentials-box">
          <p><strong>Email :</strong> ${email}</p>
          <p><strong>Mot de passe provisoire :</strong> ${data.tempPassword}</p>
          <p><strong>Parking assigné :</strong> ${data.parking_nom}</p>
        </div>
      </div>

      <div class="warning">
        <strong>⚠️ Important :</strong> Ce mot de passe ne fonctionnera qu'une seule fois. Vous devrez en choisir un nouveau dès votre première connexion.
      </div>

      <div class="section">
        <h2>🔐 POUR VOTRE PREMIÈRE CONNEXION</h2>
        <ol class="steps">
          <li>Rendez-vous sur N'DJIGI et connectez-vous</li>
          <li>Choisissez votre nouveau mot de passe personnel</li>
          <li>Accédez à votre espace de gestion</li>
        </ol>
        <a href="${appUrl}/login" class="cta-button">Accéder à mon compte</a>
      </div>

      <div class="section">
        <h2>📱 Besoin d'aide?</h2>
        <p>Contactez-nous sur WhatsApp: <a href="https://wa.me/${supportNumber}?text=Bonjour%20N'DJIGI" style="color: #2a5298;">${supportWhatsapp}</a></p>
      </div>

      <div style="margin-top: 30px; text-align: center; color: #555;">
        <p><strong>À très vite sur N'DJIGI!</strong></p>
        <p style="margin-top: 8px; font-size: 14px;">L'équipe N'DJIGI</p>
      </div>
    </div>

    <div class="footer">
      <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
      <p>© 2026 N'DJIGI. Tous droits réservés.</p>
    </div>
  </div>
</body>
</html>
`

      const result = await transporter.sendMail({
        from: `N'DJIGI <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Bienvenue sur N\'DJIGI - Vos identifiants temporaires',
        text: textContent,
        html: htmlContent
      })

      console.log(`✅ Gestionnaire welcome email sent to ${email}`)
      return result
    } catch (error) {
      console.error('❌ Gestionnaire welcome email error:', error.message)
      throw error
    }
  },

  /**
   * Send password reset email (forgot password flow)
   * @param {string} email
   * @param {Object} data - { prenom, resetLink, expiresInMinutes, ipAddress }
   */
  async sendPasswordResetEmail(email, data) {
    try {
      const supportWhatsapp = getSupportWhatsapp();
      const supportLink = buildSupportWhatsappLink();

      const textContent = `
Bonjour ${data.prenom},

Vous avez demande la reinitialisation de votre mot de passe.

Lien de reinitialisation:
${data.resetLink}

Ce lien est valide pendant ${data.expiresInMinutes} minutes.
Cette demande provient de l'adresse IP ${data.ipAddress}.

Si vous n'etes pas a l'origine de cette demande, ignorez cet email - votre mot de passe restera inchange.

Support WhatsApp: ${supportWhatsapp}
`;

      const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reinitialisation du mot de passe - N'DJIGI</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f7fb; color: #1f2937; }
    .container { max-width: 620px; margin: 24px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(30, 60, 114, 0.12); }
    .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
    .content { padding: 28px 24px; line-height: 1.6; }
    .cta { text-align: center; margin: 28px 0; }
    .cta a { display: inline-block; background: #2a5298; color: #ffffff; text-decoration: none; font-weight: 600; padding: 14px 24px; border-radius: 8px; }
    .meta { background: #eef3ff; border-left: 4px solid #2a5298; padding: 14px; border-radius: 6px; font-size: 14px; margin-top: 18px; }
    .warning { background: #fff4e8; border-left: 4px solid #f59e0b; padding: 14px; border-radius: 6px; font-size: 14px; margin-top: 18px; }
    .footer { border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; padding: 16px 24px 22px; }
    .footer a { color: #2a5298; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">N'DJIGI</h1>
      <p style="margin: 8px 0 0;">Reinitialisation de mot de passe</p>
    </div>
    <div class="content">
      <p>Bonjour <strong>${data.prenom}</strong>,</p>
      <p>Vous avez demande la reinitialisation de votre mot de passe.</p>
      <div class="cta">
        <a href="${data.resetLink}">Reinitialiser mon mot de passe</a>
      </div>
      <div class="meta">
        <p style="margin: 0 0 6px;"><strong>Expiration:</strong> Ce lien est valide pendant ${data.expiresInMinutes} minutes.</p>
        <p style="margin: 0;"><strong>Securite:</strong> Cette demande provient de l'adresse IP ${data.ipAddress}.</p>
      </div>
      <div class="warning">
        Si vous n'etes pas a l'origine de cette demande, ignorez cet email - votre mot de passe restera inchange.
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0 0 8px;">Support WhatsApp: <a href="${supportLink}">${supportWhatsapp}</a></p>
      <p style="margin: 0;">&copy; 2026 N'DJIGI. Tous droits reserves.</p>
    </div>
  </div>
</body>
</html>
`;

      return transporter.sendMail({
        from: `N'DJIGI <${process.env.SMTP_USER}>`,
        to: email,
        subject: "N'DJIGI - Reinitialisation de votre mot de passe",
        text: textContent.trim(),
        html: htmlContent
      });
    } catch (error) {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  },

  /**
   * Send password changed notification email
   * @param {string} email
   * @param {Object} data - { prenom, changedAt, ipAddress, userAgent }
   */
  async sendPasswordChangedNotification(email, data) {
    try {
      const supportWhatsapp = getSupportWhatsapp();
      const supportLink = buildSupportWhatsappLink();
      const formattedDate = formatChangedAt(data.changedAt);
      const simplifiedUserAgent = simplifyUserAgent(data.userAgent);

      const textContent = `
Bonjour ${data.prenom},

Votre mot de passe a ete modifie le ${formattedDate} depuis l'adresse IP ${data.ipAddress}.
Appareil: ${simplifiedUserAgent}

Si vous n'etes pas a l'origine de cette modification, votre compte est peut-etre compromis.
Contactez immediatement notre support.

Support WhatsApp: ${supportWhatsapp}
${supportLink}
`;

      const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mot de passe modifie - N'DJIGI</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f7fb; color: #1f2937; }
    .container { max-width: 620px; margin: 24px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(30, 60, 114, 0.12); }
    .header { background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
    .content { padding: 28px 24px; line-height: 1.6; }
    .meta { background: #eef3ff; border-left: 4px solid #2a5298; padding: 14px; border-radius: 6px; font-size: 14px; margin-top: 18px; }
    .danger { background: #fff1f2; border: 1px solid #fecdd3; border-left: 4px solid #dc2626; color: #7f1d1d; padding: 14px; border-radius: 6px; font-size: 14px; margin-top: 18px; }
    .cta { text-align: center; margin: 24px 0 6px; }
    .cta a { display: inline-block; background: #2a5298; color: #ffffff; text-decoration: none; font-weight: 600; padding: 14px 24px; border-radius: 8px; }
    .footer { border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280; padding: 16px 24px 22px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">N'DJIGI</h1>
      <p style="margin: 8px 0 0;">Notification de securite</p>
    </div>
    <div class="content">
      <p>Bonjour <strong>${data.prenom}</strong>,</p>
      <div class="meta">
        <p style="margin: 0 0 6px;">Votre mot de passe a ete modifie le <strong>${formattedDate}</strong> depuis l'adresse IP <strong>${data.ipAddress}</strong>.</p>
        <p style="margin: 0;"><strong>Appareil:</strong> ${simplifiedUserAgent}</p>
      </div>
      <div class="danger">
        Si vous n'etes pas a l'origine de cette modification, votre compte est peut-etre compromis. Contactez immediatement notre support.
      </div>
      <div class="cta">
        <a href="${supportLink}">Contacter le support</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;">&copy; 2026 N'DJIGI. Tous droits reserves.</p>
    </div>
  </div>
</body>
</html>
`;

      return transporter.sendMail({
        from: `N'DJIGI <${process.env.SMTP_USER}>`,
        to: email,
        subject: "N'DJIGI - Votre mot de passe a ete modifie",
        text: textContent.trim(),
        html: htmlContent
      });
    } catch (error) {
      throw new Error(`Failed to send password changed notification: ${error.message}`);
    }
  },

  /**
   * Test email sending (dev only)
   */
  async sendTest(email) {
    try {
      const result = await transporter.sendMail({
        from: `N'DJIGI <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Test Email - N\'DJIGI',
        text: 'This is a test email from N\'DJIGI platform.',
        html: '<p>This is a test email from N\'DJIGI platform.</p>',
      });
      return result;
    } catch (error) {
      throw new Error(`Failed to send test email: ${error.message}`);
    }
  },
};

module.exports = EmailService;
