const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Desabilitar verificação de certificado SSL para Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:1988@localhost:5432/econfere_db';

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: databaseUrl.includes('supabase') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

async function createAdmin() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Criando usuário admin...');
    
    const adminEmail = 'admin@econfere.com';
    const adminPassword = 'admin123';
    const adminName = 'Administrador';
    
    // Verificar se o usuário já existe
    const existingUser = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [adminEmail]
    );
    
    if (existingUser.rows.length > 0) {
      console.log('⚠️  Usuário admin já existe!');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   ID: ${existingUser.rows[0].id}`);
      console.log('\n💡 Se quiser redefinir a senha, delete o usuário primeiro.');
      client.release();
      await pool.end();
      return;
    }
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    // Inserir usuário admin
    const result = await client.query(
      `INSERT INTO users (name, email, password_hash, email_verified)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, email_verified, created_at`,
      [adminName, adminEmail, hashedPassword, true]
    );
    
    const admin = result.rows[0];
    
    console.log('✅ Usuário admin criado com sucesso!');
    console.log('\n📋 Credenciais de acesso:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Senha: ${adminPassword}`);
    console.log(`   Nome: ${adminName}`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email verificado: ${admin.email_verified ? 'Sim' : 'Não'}`);
    console.log(`   Criado em: ${admin.created_at}`);
    console.log('\n🔐 Use essas credenciais para fazer login no sistema.');
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao criar usuário admin:', error.message);
    console.error(error);
    client.release();
    await pool.end();
    process.exit(1);
  }
}

createAdmin();

