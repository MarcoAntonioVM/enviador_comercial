/**
 * Script para crear un usuario administrador de prueba
 * Ejecutar: node scripts/create-admin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const createAdmin = async () => {
  console.log('🔧 Creando usuario administrador...\n');

  // Datos del usuario admin
  const adminData = {
    email: 'admin@example.com',
    password: 'Admin123!',  // Password de prueba
    name: 'Administrador Principal',
    role: 'admin'
  };

  // Datos del usuario commercial
  const commercialData = {
    email: 'comercial@example.com',
    password: 'Comercial123!',  // Password de prueba
    name: 'Usuario Comercial',
    role: 'commercial'
  };

  try {
    // Conectar a la base de datos
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || '3.139.131.56',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'admin_envios',
      password: process.env.DB_PASSWORD || 'Enviador#2025!',
      database: process.env.DB_NAME || 'envios_comercial'
    });

    console.log('✓ Conectado a la base de datos\n');

    // Hashear passwords
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 10;
    const adminPasswordHash = await bcrypt.hash(adminData.password, rounds);
    const commercialPasswordHash = await bcrypt.hash(commercialData.password, rounds);

    // Insertar usuario admin
    try {
      await connection.execute(
        'INSERT INTO users (email, password_hash, name, role, active) VALUES (?, ?, ?, ?, ?)',
        [adminData.email, adminPasswordHash, adminData.name, adminData.role, true]
      );
      console.log('✓ Usuario ADMIN creado:');
      console.log(`  Email: ${adminData.email}`);
      console.log(`  Password: ${adminData.password}`);
      console.log(`  Rol: ${adminData.role}\n`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('⚠ Usuario admin ya existe\n');
      } else {
        throw error;
      }
    }

    // Insertar usuario commercial
    try {
      await connection.execute(
        'INSERT INTO users (email, password_hash, name, role, active) VALUES (?, ?, ?, ?, ?)',
        [commercialData.email, commercialPasswordHash, commercialData.name, commercialData.role, true]
      );
      console.log('✓ Usuario COMERCIAL creado:');
      console.log(`  Email: ${commercialData.email}`);
      console.log(`  Password: ${commercialData.password}`);
      console.log(`  Rol: ${commercialData.role}\n`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('⚠ Usuario comercial ya existe\n');
      } else {
        throw error;
      }
    }

    await connection.end();

    console.log('═══════════════════════════════════════════════');
    console.log('🎉 Usuarios de prueba creados exitosamente!');
    console.log('═══════════════════════════════════════════════');
    console.log('\n📝 Credenciales para login:\n');
    console.log('ADMINISTRADOR:');
    console.log(`  Email: ${adminData.email}`);
    console.log(`  Password: ${adminData.password}\n`);
    console.log('COMERCIAL:');
    console.log(`  Email: ${commercialData.email}`);
    console.log(`  Password: ${commercialData.password}\n`);
    console.log('═══════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
