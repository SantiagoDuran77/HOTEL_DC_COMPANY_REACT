import nodemailer from 'nodemailer';

// Configuración real del transporter - FUNCIÓN CORREGIDA
const createTransporter = () => {
  console.log('📧 Configurando transporte de email...');
  console.log('   Host:', process.env.EMAIL_SERVER_HOST);
  console.log('   Port:', process.env.EMAIL_SERVER_PORT);
  console.log('   User:', process.env.EMAIL_SERVER_USER);
  
  // ✅ CORRECCIÓN: createTransport en lugar de createTransporter
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_SERVER_USER,
      pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// Verificar conexión del email
export const verifyEmailConnection = async () => {
  try {
    console.log('🔍 Verificando conexión de email...');
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Servidor de email configurado correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error en configuración de email:', error.message);
    return false;
  }
};

// Email de verificación de cuenta
export const sendVerificationEmail = async (email, userName, verificationToken) => {
  try {
    console.log('📤 Enviando email de verificación a:', email);
    
    const transporter = createTransporter();
    const verificationUrl = `${process.env.CLIENT_URL}/auth/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: `"Hotel DC Company" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Verifica tu cuenta - Hotel DC Company',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #032854; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { background: #032854; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            .code { background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Hotel DC Company</h1>
          </div>
          <div class="content">
            <h2>¡Bienvenido ${userName}!</h2>
            <p>Gracias por registrarte en Hotel DC Company. Para activar tu cuenta, haz clic en el siguiente botón:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">Verificar Mi Cuenta</a>
            </p>
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <div class="code">${verificationUrl}</div>
            <p><strong>⚠️ Este enlace expirará en 24 horas.</strong></p>
            <p>Si no te registraste en Hotel DC Company, puedes ignorar este mensaje.</p>
          </div>
          <div class="footer">
            <p>Hotel DC Company - Sistema de Gestión Hotelera</p>
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email de verificación enviado exitosamente a:', email);
    console.log('   Message ID:', result.messageId);
    return true;

  } catch (error) {
    console.error('❌ Error enviando email de verificación:', error);
    return false;
  }
};

// Email de recuperación de contraseña
export const sendPasswordResetEmail = async (email, userName, resetToken) => {
  try {
    console.log('📤 Enviando email de recuperación a:', email);
    
    const transporter = createTransporter();
    const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: `"Hotel DC Company" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: 'Recuperación de Contraseña - Hotel DC Company',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            .code { background: #e5e7eb; padding: 10px; border-radius: 4px; font-family: monospace; word-break: break-all; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Recuperación de Contraseña</h1>
          </div>
          <div class="content">
            <h2>Hola ${userName},</h2>
            <p>Has solicitado restablecer tu contraseña para tu cuenta en Hotel DC Company.</p>
            <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
            <p style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            </p>
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <div class="code">${resetUrl}</div>
            <p><strong>⚠️ Este enlace expirará en 1 hora.</strong></p>
            <p style="color: #dc2626;">Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
          </div>
          <div class="footer">
            <p>Hotel DC Company - Sistema de Gestión Hotelera</p>
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email de recuperación enviado exitosamente a:', email);
    console.log('   Message ID:', result.messageId);
    return true;

  } catch (error) {
    console.error('❌ Error enviando email de recuperación:', error);
    return false;
  }
};

// Email de bienvenida
export const sendWelcomeEmail = async (email, userName) => {
  try {
    console.log('📤 Enviando email de bienvenida a:', email);
    
    const transporter = createTransporter();

    const mailOptions = {
      from: `"Hotel DC Company" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: '¡Bienvenido a Hotel DC Company!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>¡Bienvenido a Hotel DC Company!</h1>
          </div>
          <div class="content">
            <h2>Hola ${userName},</h2>
            <p>Tu cuenta ha sido verificada exitosamente. ¡Estamos encantados de tenerte con nosotros!</p>
            <p>Ahora puedes disfrutar de todos nuestros servicios:</p>
            <ul>
              <li>✅ Realizar reservas en línea</li>
              <li>✅ Gestionar tus estadías</li>
              <li>✅ Acceder a ofertas exclusivas</li>
              <li>✅ Recibir atención personalizada</li>
            </ul>
            <p>Inicia sesión en tu cuenta para comenzar a explorar:</p>
            <p style="text-align: center; margin: 20px 0;">
              <a href="${process.env.CLIENT_URL}/auth/login" class="button">
                Iniciar Sesión
              </a>
            </p>
          </div>
          <div class="footer">
            <p>Hotel DC Company - Sistema de Gestión Hotelera</p>
          </div>
        </body>
        </html>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email de bienvenida enviado exitosamente a:', email);
    console.log('   Message ID:', result.messageId);
    return true;

  } catch (error) {
    console.error('❌ Error enviando email de bienvenida:', error);
    return false;
  }
};