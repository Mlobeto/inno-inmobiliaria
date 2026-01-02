const nodemailer = require('nodemailer');
require('dotenv').config();

// Configurar el transporter de nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true para 465, false para otros puertos
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Envía un email para resetear contraseña
 * @param {string} to - Email del destinatario
 * @param {string} token - Token de reset
 * @param {string} username - Username del admin
 * @returns {Promise} Promesa con resultado del envío
 */
const sendPasswordResetEmail = async (to, token, username) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
  
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'InnoInmo'}" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Recuperación de Contraseña - InnoInmo',
    html: `
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
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar email:', error);
    throw error;
  }
};

/**
 * Envía un email de confirmación después de cambiar la contraseña
 * @param {string} to - Email del destinatario
 * @param {string} username - Username del admin
 * @returns {Promise} Promesa con resultado del envío
 */
const sendPasswordChangedEmail = async (to, username) => {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'InnoInmo'}" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Contraseña Actualizada - InnoInmo',
    html: `
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
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email de confirmación enviado:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error al enviar email de confirmación:', error);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordChangedEmail
};
