const { Router } = require("express");
const { sendEmail } = require("../emailService");

const router = Router();

/**
 * POST /api/contact
 * Recibe consultas del formulario de contacto público.
 * Body: { name, email, phone, message }
 */
router.post("/", async (req, res) => {
  const { name, email, phone, message } = req.body;

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ error: "Los campos nombre, email y mensaje son requeridos." });
  }

  // Validación básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "El formato del email no es válido." });
  }

  const contactEmail =
    process.env.CONTACT_EMAIL ||
    process.env.ACS_SENDER_ADDRESS ||
    process.env.EMAIL_USER;

  if (!contactEmail) {
    console.error("CONTACT_EMAIL no está configurado en variables de entorno.");
    return res.status(500).json({ error: "Error de configuración del servidor." });
  }

  try {
    await sendEmail({
      to: contactEmail,
      subject: `Nueva consulta de contacto: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Nueva consulta desde GestProp</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold; width: 30%;">Nombre:</td>
              <td style="padding: 8px;">${name}</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 8px; font-weight: bold;">Email:</td>
              <td style="padding: 8px;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Teléfono:</td>
              <td style="padding: 8px;">${phone || "No proporcionado"}</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 8px; font-weight: bold; vertical-align: top;">Mensaje:</td>
              <td style="padding: 8px; white-space: pre-wrap;">${message}</td>
            </tr>
          </table>
          <hr style="margin-top: 24px; border-color: #e5e7eb;" />
          <p style="color: #6b7280; font-size: 12px;">
            Este mensaje fue enviado desde el formulario de contacto de GestProp.com
          </p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, message: "Consulta enviada correctamente." });
  } catch (error) {
    console.error("Error al enviar email de contacto:", error);
    return res.status(500).json({ error: "No se pudo enviar el mensaje. Intente nuevamente." });
  }
});

module.exports = router;
