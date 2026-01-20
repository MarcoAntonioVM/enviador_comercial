/**
 * Script para insertar datos de ejemplo en la base de datos
 * Ejecutar: node scripts/seed-data.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

const seedData = async () => {
  console.log('🌱 Insertando datos de ejemplo...\n');

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'envios_commercial'
    });

    console.log('✓ Conectado a la base de datos\n');

    // Insertar sectores
    console.log('📋 Insertando sectores...');
    const sectors = [
      ['Tecnología', 'Empresas de tecnología y software', true],
      ['Salud', 'Clínicas, hospitales y servicios médicos', true],
      ['Educación', 'Instituciones educativas', true],
      ['Retail', 'Comercio minorista', true],
      ['Finanzas', 'Bancos y servicios financieros', true]
    ];

    for (const sector of sectors) {
      try {
        await connection.execute(
          'INSERT INTO sectors (name, description, active) VALUES (?, ?, ?)',
          sector
        );
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') throw error;
      }
    }
    console.log('✓ Sectores insertados\n');

    // Obtener IDs de sectores
    const [sectorRows] = await connection.execute('SELECT id, name FROM sectors LIMIT 1');
    const sectorId = sectorRows[0].id;

    // Insertar prospectos de ejemplo
    console.log('👥 Insertando prospectos...');
    const prospects = [
      ['juan.perez@empresa.com', 'Juan Pérez', 'Empresa Tech SA', sectorId, '+52 55 1234 5678', 'active', 'granted'],
      ['maria.gonzalez@startup.com', 'María González', 'Startup Innovadora', sectorId, '+52 55 8765 4321', 'active', 'granted'],
      ['carlos.lopez@negocio.com', 'Carlos López', 'Mi Negocio', sectorId, '+52 55 5555 1111', 'active', 'unknown']
    ];

    for (const prospect of prospects) {
      try {
        await connection.execute(
          'INSERT INTO prospects (email, name, company, sector_id, phone, status, consent_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          prospect
        );
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') throw error;
      }
    }
    console.log('✓ Prospectos insertados\n');

    // Obtener ID del primer usuario
    const [userRows] = await connection.execute('SELECT id FROM users LIMIT 1');
    
    if (userRows.length === 0) {
      console.log('⚠️  No hay usuarios. Ejecuta primero: node scripts/create-admin.js\n');
    } else {
      const userId = userRows[0].id;

      // Insertar plantilla de ejemplo
      console.log('📧 Insertando plantilla de email...');
      const templateHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #007bff; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f8f9fa; }
    .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Bienvenido {{name}}!</h1>
    </div>
    <div class="content">
      <p>Hola {{name}},</p>
      <p>Nos complace darte la bienvenida a nuestro servicio. Aquí están tus credenciales de acceso:</p>
      <p><strong>Usuario:</strong> {{email}}</p>
      <p><strong>Contraseña temporal:</strong> {{password}}</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{login_url}}" class="button">Iniciar Sesión</a>
      </p>
      <p>Por favor, cambia tu contraseña después del primer inicio de sesión.</p>
    </div>
    <div class="footer">
      <p>Este es un correo automático, por favor no responder.</p>
      <p>© 2026 Tu Empresa. Todos los derechos reservados.</p>
    </div>
  </div>
</body>
</html>`;

      const templateText = `
Hola {{name}},

Nos complace darte la bienvenida a nuestro servicio.

Credenciales de acceso:
Usuario: {{email}}
Contraseña temporal: {{password}}

Accede aquí: {{login_url}}

Por favor, cambia tu contraseña después del primer inicio de sesión.

Este es un correo automático, por favor no responder.
© 2026 Tu Empresa. Todos los derechos reservados.
`;

      try {
        await connection.execute(
          `INSERT INTO email_templates (name, sector_id, subject, html_content, text_content, variables, is_default, active, created_by) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            'Plantilla de Bienvenida',
            sectorId,
            'Bienvenido a nuestro servicio - Credenciales de acceso',
            templateHtml,
            templateText,
            JSON.stringify(['name', 'email', 'password', 'login_url']),
            true,
            true,
            userId
          ]
        );
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') throw error;
      }
      console.log('✓ Plantilla insertada\n');

      // Insertar remitente
      console.log('📤 Insertando remitente...');
      try {
        await connection.execute(
          `INSERT INTO senders (name, email, reply_to, signature, smtp_config, is_default, daily_limit) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            'Equipo Comercial',
            'comercial@tuempresa.com',
            'soporte@tuempresa.com',
            'Equipo Comercial\nTu Empresa\nwww.tuempresa.com',
            JSON.stringify({
              provider: 'brevo',
              api_key: process.env.BREVO_API_KEY || ''
            }),
            true,
            500
          ]
        );
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') throw error;
      }
      console.log('✓ Remitente insertado\n');
    }

    await connection.end();

    console.log('═══════════════════════════════════════════════');
    console.log('🎉 Datos de ejemplo insertados exitosamente!');
    console.log('═══════════════════════════════════════════════\n');
    console.log('📊 Datos insertados:');
    console.log('  - 5 Sectores');
    console.log('  - 3 Prospectos');
    console.log('  - 1 Plantilla de email');
    console.log('  - 1 Remitente\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

seedData();
