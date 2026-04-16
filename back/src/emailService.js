const nodemailer = require('nodemailer');
require('dotenv').config();

// ============================================================
// Estrategia dual:
//  - En producción (ACS_CONNECTION_STRING presente): usa Azure
//    Communication Services Email SDK.
//  - En desarrollo/local: usa nodemailer con SMTP (Gmail, etc.)
// ============================================================

const useAzure = !!process.env.ACS_CONNECTION_STRING;

// --- Cliente Azure Communication Services (producción) ---
let acsClient = null;
if (useAzure) {
  const { EmailClient } = require('@azure/communication-email');
  acsClient = new EmailClient(process.env.ACS_CONNECTION_STRING);
}

// --- Transporter nodemailer (desarrollo) ---
const transporter = useAzure
  ? null
  : nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

/**
 * Envía un email usando ACS (producción) o nodemailer (desarrollo).
 * @param {{ to: string, subject: string, html: string }} options
 */
const sendEmail = async ({ to, subject, html }) => {
  if (useAzure) {
    const senderAddress =
      process.env.ACS_SENDER_ADDRESS || 'DoNotReply@azurecomm.net';

    const message = {
      senderAddress,
      recipients: { to: [{ address: to }] },
      content: { subject, html },
    };

    const poller = await acsClient.beginSend(message);
    const result = await poller.pollUntilDone();
    return { success: true, messageId: result.id };
  } else {
    const fromName = process.env.EMAIL_FROM_NAME || 'AdminProp';
    const fromUser = process.env.EMAIL_USER;
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromUser}>`,
      to,
      subject,
      html,
    });
    return { success: true, messageId: info.messageId };
  }
};

/**
 * Envía un email para resetear contraseña
 * @param {string} to - Email del destinatario
 * @param {string} token - Token de reset
 * @param {string} username - Username del admin
 * @returns {Promise} Promesa con resultado del envío
 */
const sendPasswordResetEmail = async (to, token, username) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;

  const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
            .button { 
              display: inline-block; 
              padding: 12px 30px; 
              background: #4F46E5; 
              color: white !important; 
              text-decoration: none; 
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .warning { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 10px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Recuperación de Contraseña</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${username}</strong>,</p>
              
              <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en InnoInmo.</p>
              
              <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
              </div>
              
              <p>O copia y pega este enlace en tu navegador:</p>
              <p style="word-break: break-all; color: #4F46E5;">
                <a href="${resetUrl}">${resetUrl}</a>
              </p>
              
              <div class="warning">
                <strong>⚠️ Importante:</strong>
                <ul style="margin: 5px 0; padding-left: 20px;">
                  <li>Este enlace expirará en <strong>1 hora</strong></li>
                  <li>Solo puede ser usado una vez</li>
                  <li>Si no solicitaste este cambio, ignora este email</li>
                </ul>
              </div>
              
              <p>Si tienes problemas con el enlace, contáctanos respondiendo este email.</p>
              
              <p style="margin-top: 30px;">
                Saludos,<br>
                <strong>El equipo de InnoInmo</strong>
              </p>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no respondas directamente.</p>
              <p>&copy; ${new Date().getFullYear()} InnoInmo. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
  `;

  return sendEmail({ to, subject: 'Recuperación de Contraseña - AdminProp', html });
};

/**
 * Envía un email de confirmación después de cambiar la contraseña
 * @param {string} to - Email del destinatario
 * @param {string} username - Username del admin
 * @returns {Promise} Promesa con resultado del envío
 */
const sendPasswordChangedEmail = async (to, username) => {
  const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .alert { background: #FEE2E2; border-left: 4px solid #EF4444; padding: 10px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Contraseña Actualizada</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${username}</strong>,</p>
              
              <p>Te confirmamos que la contraseña de tu cuenta en InnoInmo ha sido actualizada exitosamente.</p>
              
              <p>Ahora puedes iniciar sesión con tu nueva contraseña.</p>
              
              <div class="alert">
                <strong>🚨 ¿No fuiste tú?</strong>
                <p style="margin: 5px 0;">
                  Si no realizaste este cambio, contacta inmediatamente con soporte. 
                  Tu cuenta podría estar comprometida.
                </p>
              </div>
              
              <p style="margin-top: 30px;">
                Saludos,<br>
                <strong>El equipo de InnoInmo</strong>
              </p>
            </div>
            <div class="footer">
              <p>Este es un email automático, por favor no respondas directamente.</p>
              <p>&copy; ${new Date().getFullYear()} InnoInmo. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
      </html>
  `;

  return sendEmail({ to, subject: 'Contraseña Actualizada - AdminProp', html });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail
};
