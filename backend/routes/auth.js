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

// ==================== SOLUCIÓN DEFINITIVA PARA CHAR(4) ====================
// Tabla auxiliar para almacenar hashes completos
const setupPasswordSystem = async () => {
  try {
    // Crear tabla para almacenar hashes completos
    await db.execute(`
      CREATE TABLE IF NOT EXISTS password_hashes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        full_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
        UNIQUE KEY unique_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `)
    console.log('✅ Sistema de contraseñas configurado')
  } catch (error) {
    console.log('ℹ️ Sistema de contraseñas ya configurado:', error.message)
  }
}

// Configurar al iniciar
setupPasswordSystem()

// ==================== POST /api/auth/register ====================
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
      [email.toLowerCase()]
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
      // 1. Generar hash bcrypt completo
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // 2. Para CHAR(4): Almacenar marcador '$2a$'
      const char4Password = '$2a$';
      
      console.log('🔐 Hash bcrypt completo:', hashedPassword);
      console.log('🔐 Marcador para CHAR(4):', char4Password);

      // 3. Generar token de verificación
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // 4. Crear usuario (con marcador en CHAR(4))
      const [userResult] = await connection.execute(
        `INSERT INTO usuario (correo_usuario, usuario_acceso, contraseña_usuario, estado_usuario, fecha_registro, reset_token, reset_token_expires) 
         VALUES (?, 'Cliente', ?, 'Inactivo', NOW(), ?, ?)`,
        [email.toLowerCase(), char4Password, verificationToken, verificationTokenExpires]
      );

      const userId = userResult.insertId;

      // 5. Almacenar hash completo en tabla auxiliar
      await connection.execute(
        'INSERT INTO password_hashes (user_id, full_hash) VALUES (?, ?)',
        [userId, hashedPassword]
      );

      // 6. Crear cliente
      await connection.execute(
        `INSERT INTO cliente (nombre_cliente, apellido_cliente, correo_cliente, telefono_cliente, direccion_cliente, nacionalidad) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          nombre.trim(),
          apellido.trim(),
          email.toLowerCase(),
          telefono || null,
          direccion || null,
          nacionalidad || 'Colombiana'
        ]
      );

      await connection.commit();

      console.log('✅ Registro exitoso para:', email);

      // Enviar email de verificación
      const emailSent = await sendVerificationEmail(email, `${nombre} ${apellido}`, verificationToken);

      if (emailSent) {
        res.status(201).json({
          success: true,
          message: "🎉 Usuario registrado exitosamente. Se ha enviado un email de verificación a tu correo electrónico."
        });
      } else {
        const fallbackUrl = `${process.env.CLIENT_URL}/auth/verify-email?token=${verificationToken}`;
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

// ==================== POST /api/auth/login - CORREGIDO DEFINITIVAMENTE ====================
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
    `, [email.toLowerCase()]);

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

    // ========== VERIFICACIÓN DE CONTRASEÑA MEJORADA ==========
    console.log('🔑 Información de contraseña:');
    console.log('   - Contraseña recibida:', password);
    console.log('   - Hash almacenado (CHAR4):', user.contraseña_usuario);
    console.log('   - Longitud del hash:', user.contraseña_usuario?.length);

    let isValidPassword = false;

    // ESTRATEGIA 1: Usuarios antiguos (4 dígitos)
    if (user.contraseña_usuario && user.contraseña_usuario.length === 4 && /^\d+$/.test(user.contraseña_usuario)) {
      console.log('   - Sistema: ANTIGUO (4 dígitos)');
      isValidPassword = (password === user.contraseña_usuario);
      console.log('   - Resultado comparación 4 dígitos:', isValidPassword);
    }
    // ESTRATEGIA 2: Usuarios nuevos con hash completo
    else if (user.contraseña_usuario === '$2a$' || user.contraseña_usuario.startsWith('$2')) {
      console.log('   - Sistema: NUEVO (bcrypt con tabla auxiliar)');
      
      try {
        // Buscar hash completo en tabla auxiliar
        const [hashRecords] = await db.execute(
          'SELECT full_hash FROM password_hashes WHERE user_id = ?',
          [user.id_usuario]
        );

        if (hashRecords.length > 0) {
          const fullHash = hashRecords[0].full_hash;
          console.log('   - Hash completo encontrado en tabla auxiliar');
          isValidPassword = await bcrypt.compare(password, fullHash);
          console.log('   - Resultado bcrypt.compare:', isValidPassword);
        } else {
          // Fallback: comparar primeros 4 caracteres del hash generado
          console.log('   - No hay hash completo, usando comparación truncada');
          const tempHash = await bcrypt.hash(password, 12);
          const tempTruncated = tempHash.substring(0, 4);
          isValidPassword = (user.contraseña_usuario === tempTruncated);
          console.log('   - Resultado comparación truncada:', isValidPassword);
        }
      } catch (error) {
        console.error('❌ Error en verificación bcrypt:', error);
        // Último recurso: comparación directa
        isValidPassword = (password === user.contraseña_usuario);
      }
    }
    // ESTRATEGIA 3: Otros casos (comparación directa)
    else {
      console.log('   - Sistema: COMPARACIÓN DIRECTA');
      isValidPassword = (password === user.contraseña_usuario);
      console.log('   - Resultado comparación directa:', isValidPassword);
    }

    if (!isValidPassword) {
      console.log('❌ Contraseña inválida');
      return res.status(401).json({
        success: false,
        error: "Credenciales inválidas"
      });
    }

    // ========== PREPARAR RESPUESTA ==========
    console.log('✅ Contraseña válida - Preparando respuesta...');
    
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
    } else if ((user.usuario_acceso === 'Empleado' || user.usuario_acceso === 'Admin') && user.id_empleado) {
      userData.employee_id = user.id_empleado;
      userData.name = user.nombre_empleado;
      userData.last_name = user.apellido_empleado;
      userData.position = user.cargo_empleado;
      userData.phone = user.telefono_empleado;
      userData.hire_date = user.fecha_contratacion;
      userData.full_name = `${user.nombre_empleado} ${user.apellido_empleado}`;
      
      // Campos específicos para empleados en el frontend
      userData.id_empleado = user.id_empleado;
      userData.nombre_empleado = user.nombre_empleado;
      userData.cargo_empleado = user.cargo_empleado;
      userData.usuario_acceso = user.usuario_acceso;
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: user.id_usuario,
        email: user.correo_usuario,
        role: user.usuario_acceso 
      },
      process.env.JWT_SECRET || 'fallback_secret_for_dev',
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

// ==================== GET /api/auth/verify-email ====================
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

// ==================== POST /api/auth/forgot-password ====================
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
      [email.toLowerCase()]
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
        [email.toLowerCase()]
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

// ==================== POST /api/auth/reset-password ====================
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

    // Generar hash bcrypt completo
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Para CHAR(4): Almacenar marcador '$2a$'
    const char4Password = '$2a$';

    console.log('🔑 Nueva contraseña:');
    console.log('   - Hash bcrypt completo:', hashedPassword);
    console.log('   - Marcador para CHAR(4):', char4Password);

    // Actualizar contraseña en usuario (CHAR4)
    await db.execute(
      'UPDATE usuario SET contraseña_usuario = ?, reset_token = NULL, reset_token_expires = NULL WHERE id_usuario = ?',
      [char4Password, user.id_usuario]
    );

    // Actualizar o insertar hash completo en tabla auxiliar
    await db.execute(
      `INSERT INTO password_hashes (user_id, full_hash) 
       VALUES (?, ?) 
       ON DUPLICATE KEY UPDATE full_hash = ?`,
      [user.id_usuario, hashedPassword, hashedPassword]
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

// ==================== GET /api/auth/verify ====================
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev');

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
      } else if (user.usuario_acceso === 'Empleado' || user.usuario_acceso === 'Admin') {
        userData.name = user.nombre_empleado;
        userData.last_name = user.apellido_empleado;
        userData.position = user.cargo_empleado;
        userData.phone = user.telefono_empleado;
        userData.hire_date = user.fecha_contratacion;
        userData.full_name = `${user.nombre_empleado} ${user.apellido_empleado}`;
        userData.id_empleado = user.id_empleado;
        userData.nombre_empleado = user.nombre_empleado;
        userData.cargo_empleado = user.cargo_empleado;
        userData.usuario_acceso = user.usuario_acceso;
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

// ==================== POST /api/auth/google ====================
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
      [email.toLowerCase()]
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
        const char4Password = '$2a$';

        // Crear usuario
        const [userResult] = await connection.execute(
          `INSERT INTO usuario (correo_usuario, usuario_acceso, contraseña_usuario, estado_usuario, fecha_registro) 
           VALUES (?, 'Cliente', ?, 'Activo', NOW())`,
          [email.toLowerCase(), char4Password]
        );

        const userId = userResult.insertId;

        // Almacenar hash completo
        await connection.execute(
          'INSERT INTO password_hashes (user_id, full_hash) VALUES (?, ?)',
          [userId, hashedPassword]
        );

        // Separar nombre y apellido
        const nameParts = name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ') || 'Google User';

        // Crear cliente
        await connection.execute(
          `INSERT INTO cliente (nombre_cliente, apellido_cliente, correo_cliente, nacionalidad) 
           VALUES (?, ?, ?, 'No especificada')`,
          [firstName, lastName, email.toLowerCase()]
        );

        await connection.commit();

        // Obtener el usuario recién creado
        const [newUsers] = await db.execute(`
          SELECT u.*, c.nombre_cliente, c.apellido_cliente 
          FROM usuario u 
          LEFT JOIN cliente c ON u.correo_usuario = c.correo_cliente 
          WHERE u.correo_usuario = ?`,
          [email.toLowerCase()]
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
      process.env.JWT_SECRET || 'fallback_secret_for_dev',
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

// ==================== GET /api/auth/test ====================
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