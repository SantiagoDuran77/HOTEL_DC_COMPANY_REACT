import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import db from "../config/database.js"
import crypto from "crypto"
import { 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendWelcomeEmail,
  verifyEmailConnection 
} from "../utils/emailService.js"

const router = express.Router()

// Verificar configuración de email al iniciar
verifyEmailConnection().then(success => {
  if (success) {
    console.log('✅ Email service ready for real emails');
  } else {
    console.log('❌ Email service not available');
  }
});

// POST /api/auth/register - Registrar nuevo usuario
router.post("/register", async (req, res) => {
  let connection;
  try {
    const { 
      nombre, 
      apellido,
      email, 
      password, 
      confirmPassword,
      telefono, 
      direccion, 
      nacionalidad 
    } = req.body;

    console.log('📝 Intento de registro para:', email);

    // Validaciones
    if (!nombre || !apellido || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Todos los campos obligatorios deben ser completados"
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: "Las contraseñas no coinciden"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "La contraseña debe tener al menos 6 caracteres"
      });
    }

    // Verificar si el usuario ya existe
    const [existingUsers] = await db.execute(
      'SELECT * FROM usuario WHERE correo_usuario = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Ya existe un usuario con este correo electrónico"
      });
    }

    // Iniciar transacción
    connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 12);

      // Generar token de verificación (64 caracteres hexadecimal)
      const verificationToken = crypto.randomBytes(32).toString('hex');
      
      // Fecha de expiración (24 horas desde ahora)
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      console.log('🔐 Token generado:', verificationToken);
      console.log('⏰ Expira:', verificationTokenExpires);

      // 1. Crear usuario (inicialmente inactivo)
      const [userResult] = await connection.execute(
        `INSERT INTO usuario (correo_usuario, usuario_acceso, contraseña_usuario, estado_usuario, fecha_registro, reset_token, reset_token_expires) 
         VALUES (?, 'Cliente', ?, 'Inactivo', NOW(), ?, ?)`,
        [email, hashedPassword, verificationToken, verificationTokenExpires]
      );

      const userId = userResult.insertId;

      // 2. Crear cliente
      await connection.execute(
        `INSERT INTO cliente (nombre_cliente, apellido_cliente, correo_cliente, telefono_cliente, direccion_cliente, nacionalidad) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          nombre.trim(),
          apellido.trim(),
          email,
          telefono || null,
          direccion || null,
          nacionalidad || 'Colombiana'
        ]
      );

      await connection.commit();

      console.log('✅ Registro exitoso para:', email);

      // ENVIAR EMAIL REAL DE VERIFICACIÓN
      const emailSent = await sendVerificationEmail(email, `${nombre} ${apellido}`, verificationToken);

      if (emailSent) {
        res.status(201).json({
          success: true,
          message: "🎉 Usuario registrado exitosamente. Se ha enviado un email de verificación a tu correo electrónico."
        });
      } else {
        // Fallback si falla el email
        const fallbackUrl = `${process.env.CLIENT_URL}/auth/verify-email?token=${verificationToken}`;
        console.log('🔄 Fallback - URL de verificación:', fallbackUrl);
        
        res.status(201).json({
          success: true,
          message: "Usuario registrado exitosamente. Por problemas técnicos con el email, usa el siguiente enlace:",
          verification_url: fallbackUrl
        });
      }

    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('❌ Error en registro:', error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al registrar el usuario"
    });
  } finally {
    if (connection) connection.release();
  }
});

// GET /api/auth/verify-email - Verificar email
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    console.log('🔐 Verificando email con token:', token);

    if (!token) {
      return res.status(400).json({
        success: false,
        error: "Token de verificación requerido"
      });
    }

    // Buscar usuario con token válido
    const [users] = await db.execute(
      'SELECT * FROM usuario WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );

    console.log('🔍 Usuarios encontrados con token:', users.length);

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Token de verificación inválido o expirado"
      });
    }

    const user = users[0];
    console.log('✅ Token válido para usuario:', user.correo_usuario);

    // Activar usuario y limpiar token
    await db.execute(
      'UPDATE usuario SET estado_usuario = "Activo", reset_token = NULL, reset_token_expires = NULL WHERE id_usuario = ?',
      [user.id_usuario]
    );

    console.log('✅ Email verificado y cuenta activada para:', user.correo_usuario);

    // ENVIAR EMAIL DE BIENVENIDA
    const [clients] = await db.execute(
      'SELECT * FROM cliente WHERE correo_cliente = ?',
      [user.correo_usuario]
    );

    if (clients.length > 0) {
      const client = clients[0];
      sendWelcomeEmail(user.correo_usuario, `${client.nombre_cliente} ${client.apellido_cliente}`)
        .catch(err => console.error('Error enviando email de bienvenida:', err));
    }

    res.json({
      success: true,
      message: "✅ Email verificado exitosamente. Tu cuenta ahora está activa. Ya puedes iniciar sesión."
    });

  } catch (error) {
    console.error('❌ Error verificando email:', error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor al verificar el email"
    });
  }
});

// POST /api/auth/login - Iniciar sesión CORREGIDO DEFINITIVAMENTE
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Intento de login para:', email);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email y contraseña son requeridos"
      });
    }

    // Buscar usuario
    const [users] = await db.execute(`
      SELECT 
        u.id_usuario,
        u.correo_usuario,
        u.contraseña_usuario,
        u.usuario_acceso,
        u.estado_usuario,
        u.fecha_registro,
        c.id_cliente,
        c.nombre_cliente,
        c.apellido_cliente,
        c.telefono_cliente,
        c.direccion_cliente,
        c.nacionalidad,
        e.id_empleado,
        e.nombre_empleado,
        e.apellido_empleado,
        e.cargo_empleado,
        e.telefono_empleado,
        e.fecha_contratacion
      FROM usuario u
      LEFT JOIN cliente c ON u.correo_usuario = c.correo_cliente
      LEFT JOIN empleado e ON u.correo_usuario = e.correo_empleado
      WHERE u.correo_usuario = ?
    `, [email]);

    if (users.length === 0) {
      console.log('❌ Usuario no encontrado:', email);
      return res.status(401).json({
        success: false,
        error: "Credenciales inválidas"
      });
    }

    const user = users[0];
    console.log('👤 Usuario encontrado:', user.correo_usuario, 'Estado:', user.estado_usuario);

    // Verificar si la cuenta está verificada
    if (user.estado_usuario === 'Inactivo') {
      return res.status(401).json({
        success: false,
        error: "Tu cuenta no está verificada. Por favor verifica tu email antes de iniciar sesión."
      });
    }

    // DEBUG: Mostrar información de la contraseña
    console.log('🔑 Información de contraseña:');
    console.log('   - Contraseña recibida:', password);
    console.log('   - Hash almacenado:', user.contraseña_usuario);
    console.log('   - Longitud del hash:', user.contraseña_usuario?.length);

    // VERIFICACIÓN DE CONTRASEÑA MEJORADA
    let isValidPassword = false;

    try {
      // Siempre intentar comparar con bcrypt primero
      if (user.contraseña_usuario) {
        // Si el hash tiene la estructura de bcrypt (comienza con $2a$, $2b$, etc.)
        if (user.contraseña_usuario.startsWith('$2')) {
          console.log('   - Tipo: Bcrypt hash - usando bcrypt.compare()');
          isValidPassword = await bcrypt.compare(password, user.contraseña_usuario);
        } else {
          // Si no es un hash bcrypt, podría ser texto plano (usuarios antiguos)
          console.log('   - Tipo: Texto plano - comparación directa');
          isValidPassword = (password === user.contraseña_usuario);
        }
      }
    } catch (bcryptError) {
      console.error('❌ Error en bcrypt.compare:', bcryptError);
      // Si bcrypt falla, intentar comparación directa
      isValidPassword = (password === user.contraseña_usuario);
    }

    console.log('   - Contraseña válida:', isValidPassword);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: "Credenciales inválidas"
      });
    }

    // Preparar datos del usuario
    const userData = {
      id: user.id_usuario,
      email: user.correo_usuario,
      role: user.usuario_acceso,
      status: user.estado_usuario,
      registration_date: user.fecha_registro
    };

    // Agregar información específica
    if (user.usuario_acceso === 'Cliente' && user.id_cliente) {
      userData.client_id = user.id_cliente;
      userData.name = user.nombre_cliente;
      userData.last_name = user.apellido_cliente;
      userData.phone = user.telefono_cliente;
      userData.address = user.direccion_cliente;
      userData.nationality = user.nacionalidad;
      userData.full_name = `${user.nombre_cliente} ${user.apellido_cliente}`;
    } else if (user.usuario_acceso === 'Empleado' && user.id_empleado) {
      userData.employee_id = user.id_empleado;
      userData.name = user.nombre_empleado;
      userData.last_name = user.apellido_empleado;
      userData.position = user.cargo_empleado;
      userData.phone = user.telefono_empleado;
      userData.hire_date = user.fecha_contratacion;
      userData.full_name = `${user.nombre_empleado} ${user.apellido_empleado}`;
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: user.id_usuario,
        email: user.correo_usuario,
        role: user.usuario_acceso 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Login exitoso para:', user.correo_usuario);

    res.json({
      success: true,
      message: "Login exitoso",
      accessToken: token,
      user: userData
    });

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor"
    });
  }
});

// POST /api/auth/forgot-password - Recuperación de contraseña
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "El correo electrónico es requerido"
      });
    }

    console.log('📧 Solicitud de recuperación para:', email);

    // Verificar si el usuario existe
    const [users] = await db.execute(
      'SELECT * FROM usuario WHERE correo_usuario = ?',
      [email]
    );

    if (users.length === 0) {
      // Por seguridad, no revelar que el email no existe
      console.log('📧 Recuperación solicitada para email no existente:', email);
      return res.json({
        success: true,
        message: "Si el email existe en nuestro sistema, recibirás un enlace de recuperación"
      });
    }

    const user = users[0];

    // Obtener nombre del usuario
    let userName = 'Usuario';
    if (user.usuario_acceso === 'Cliente') {
      const [clients] = await db.execute(
        'SELECT * FROM cliente WHERE correo_cliente = ?',
        [email]
      );
      if (clients.length > 0) {
        const client = clients[0];
        userName = `${client.nombre_cliente} ${client.apellido_cliente}`;
      }
    }

    // Generar token de recuperación
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hora

    // Guardar token en la base de datos
    await db.execute(
      'UPDATE usuario SET reset_token = ?, reset_token_expires = ? WHERE id_usuario = ?',
      [resetToken, resetTokenExpires, user.id_usuario]
    );

    // ENVIAR EMAIL REAL DE RECUPERACIÓN
    const emailSent = await sendPasswordResetEmail(email, userName, resetToken);

    if (emailSent) {
      res.json({
        success: true,
        message: "Se ha enviado un enlace de recuperación a tu correo electrónico"
      });
    } else {
      // Fallback si falla el email
      res.json({
        success: true,
        message: "Se ha enviado un enlace de recuperación a tu correo electrónico",
        debug_info: `Si no recibes el email, usa este enlace: ${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`
      });
    }

  } catch (error) {
    console.error('❌ Error en recuperación:', error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor"
    });
  }
});

// POST /api/auth/reset-password - Restablecer contraseña
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    console.log('🔄 Intento de restablecimiento con token');

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Token y nueva contraseña son requeridos"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: "La contraseña debe tener al menos 6 caracteres"
      });
    }

    // Buscar usuario con token válido
    const [users] = await db.execute(
      'SELECT * FROM usuario WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Token inválido o expirado"
      });
    }

    const user = users[0];

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // DEBUG: Mostrar información del hash
    console.log('🔑 Nueva contraseña encriptada:');
    console.log('   - Contraseña original:', newPassword);
    console.log('   - Hash bcrypt:', hashedPassword);
    console.log('   - Longitud del hash:', hashedPassword.length);

    // Actualizar contraseña
    await db.execute(
      'UPDATE usuario SET contraseña_usuario = ?, reset_token = NULL, reset_token_expires = NULL WHERE id_usuario = ?',
      [hashedPassword, user.id_usuario]
    );

    console.log('✅ Contraseña restablecida para:', user.correo_usuario);

    res.json({
      success: true,
      message: "Contraseña restablecida exitosamente"
    });

  } catch (error) {
    console.error('❌ Error restableciendo contraseña:', error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor"
    });
  }
});

// GET /api/auth/verify - Verificar token
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Token no proporcionado"
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscar usuario actualizado
      const [users] = await db.execute(`
        SELECT 
          u.id_usuario,
          u.correo_usuario,
          u.usuario_acceso,
          u.estado_usuario,
          u.fecha_registro,
          c.nombre_cliente,
          c.apellido_cliente,
          c.telefono_cliente,
          c.direccion_cliente,
          c.nacionalidad,
          e.nombre_empleado,
          e.apellido_empleado,
          e.cargo_empleado,
          e.telefono_empleado,
          e.fecha_contratacion
        FROM usuario u
        LEFT JOIN cliente c ON u.correo_usuario = c.correo_cliente
        LEFT JOIN empleado e ON u.correo_usuario = e.correo_empleado
        WHERE u.id_usuario = ?
      `, [decoded.userId]);

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          error: "Usuario no encontrado"
        });
      }

      const user = users[0];

      const userData = {
        id: user.id_usuario,
        email: user.correo_usuario,
        role: user.usuario_acceso,
        status: user.estado_usuario,
        registration_date: user.fecha_registro
      };

      if (user.usuario_acceso === 'Cliente') {
        userData.name = user.nombre_cliente;
        userData.last_name = user.apellido_cliente;
        userData.phone = user.telefono_cliente;
        userData.address = user.direccion_cliente;
        userData.nationality = user.nacionalidad;
        userData.full_name = `${user.nombre_cliente} ${user.apellido_cliente}`;
      } else if (user.usuario_acceso === 'Empleado') {
        userData.name = user.nombre_empleado;
        userData.last_name = user.apellido_empleado;
        userData.position = user.cargo_empleado;
        userData.phone = user.telefono_empleado;
        userData.hire_date = user.fecha_contratacion;
        userData.full_name = `${user.nombre_empleado} ${user.apellido_empleado}`;
      }

      res.json({
        success: true,
        user: userData
      });

    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: "Token inválido"
      });
    }

  } catch (error) {
    console.error('❌ Error verificando token:', error);
    res.status(500).json({
      success: false,
      error: "Error interno del servidor"
    });
  }
});

// POST /api/auth/google - Google OAuth
router.post("/google", async (req, res) => {
  try {
    const { email, name } = req.body;

    console.log('🔐 Google login attempt for:', email);

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: "Email y nombre son requeridos para login con Google"
      });
    }

    // Buscar si el usuario ya existe
    const [users] = await db.execute(
      'SELECT * FROM usuario WHERE correo_usuario = ?',
      [email]
    );

    let user;

    if (users.length === 0) {
      // Usuario nuevo - crear cuenta automáticamente
      console.log('👤 New Google user, creating account...');
      
      const connection = await db.getConnection();
      await connection.beginTransaction();
      
      try {
        // Generar contraseña segura para Google users
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const hashedPassword = await bcrypt.hash(randomPassword, 12);

        // Crear usuario (activado automáticamente para Google)
        const [userResult] = await connection.execute(
          `INSERT INTO usuario (correo_usuario, usuario_acceso, contraseña_usuario, estado_usuario, fecha_registro) 
           VALUES (?, 'Cliente', ?, 'Activo', NOW())`,
          [email, hashedPassword]
        );

        const userId = userResult.insertId;

        // Separar nombre y apellido
        const nameParts = name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || 'Google User';

        // Crear cliente
        await connection.execute(
          `INSERT INTO cliente (nombre_cliente, apellido_cliente, correo_cliente, nacionalidad) 
           VALUES (?, ?, ?, 'No especificada')`,
          [firstName, lastName, email]
        );

        await connection.commit();

        // Obtener el usuario recién creado
        const [newUsers] = await db.execute(`
          SELECT u.*, c.nombre_cliente, c.apellido_cliente 
          FROM usuario u 
          LEFT JOIN cliente c ON u.correo_usuario = c.correo_cliente 
          WHERE u.correo_usuario = ?`,
          [email]
        );
        
        user = newUsers[0];
        console.log('✅ New Google user created:', email);

        // Enviar email de bienvenida
        sendWelcomeEmail(email, name).catch(err => 
          console.log('⚠️ No se pudo enviar email de bienvenida:', err.message)
        );

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } else {
      // Usuario existente
      user = users[0];
      
      if (user.estado_usuario === 'Inactivo') {
        // Activar cuenta si estaba inactiva
        await db.execute(
          'UPDATE usuario SET estado_usuario = "Activo" WHERE id_usuario = ?',
          [user.id_usuario]
        );
        user.estado_usuario = 'Activo';
      }
    }

    // Obtener datos completos del usuario
    const [userDetails] = await db.execute(`
      SELECT 
        u.*,
        c.nombre_cliente,
        c.apellido_cliente,
        c.telefono_cliente,
        c.direccion_cliente,
        c.nacionalidad
      FROM usuario u
      LEFT JOIN cliente c ON u.correo_usuario = c.correo_cliente
      WHERE u.id_usuario = ?
    `, [user.id_usuario]);

    const userData = {
      id: user.id_usuario,
      email: user.correo_usuario,
      role: user.usuario_acceso,
      status: user.estado_usuario,
      registration_date: user.fecha_registro
    };

    // Agregar información específica
    if (user.usuario_acceso === 'Cliente' && userDetails[0]) {
      const details = userDetails[0];
      userData.name = details.nombre_cliente;
      userData.last_name = details.apellido_cliente;
      userData.phone = details.telefono_cliente;
      userData.address = details.direccion_cliente;
      userData.nationality = details.nacionalidad;
      userData.full_name = `${details.nombre_cliente} ${details.apellido_cliente}`;
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: user.id_usuario,
        email: user.correo_usuario,
        role: user.usuario_acceso 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Google login successful for:', email);

    res.json({
      success: true,
      message: "Login con Google exitoso",
      accessToken: token,
      user: userData
    });

  } catch (error) {
    console.error('❌ Google login error:', error);
    res.status(500).json({
      success: false,
      error: "Error en autenticación con Google"
    });
  }
});

// GET /api/auth/test - Ruta de prueba
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Sistema de autenticación funcionando correctamente",
    timestamp: new Date().toISOString(),
    endpoints: [
      "POST /api/auth/register",
      "POST /api/auth/login",
      "GET /api/auth/verify-email", 
      "POST /api/auth/forgot-password",
      "POST /api/auth/reset-password",
      "GET /api/auth/verify",
      "POST /api/auth/google"
    ]
  });
});

export default router;