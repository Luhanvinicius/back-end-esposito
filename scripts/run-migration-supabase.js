// Script para executar migration usando credenciais do Supabase
const { Pool } = require('pg');

// Desabilitar verificação de certificado SSL para Node.js
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Credenciais do Supabase fornecidas
const connectionString = 'postgres://postgres.oobevnrndudfxogrsurf:Pyap5vo2CBZLECsj@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require';

console.log('🔗 Conectando ao banco de dados Supabase...');
console.log('   Host: aws-1-us-east-1.pooler.supabase.com:5432');
console.log('   Database: postgres\n');

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('✅ Conectado ao banco de dados!');
    console.log('🔄 Executando migration 002_add_role_to_users.sql...\n');
    
    await client.query('BEGIN');
    
    try {
      // 1. Adicionar coluna role
      console.log('   → Adicionando coluna role...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' 
        CHECK (role IN ('user', 'admin'))
      `);
      console.log('   ✅ Coluna role adicionada');
      
      // 2. Criar índice
      console.log('   → Criando índice...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)
      `);
      console.log('   ✅ Índice criado');
      
      // 3. Atualizar admin existente
      console.log('   → Atualizando usuário admin...');
      const updateResult = await client.query(`
        UPDATE users 
        SET role = 'admin' 
        WHERE email = 'admin@econfere.com'
      `);
      console.log(`   ✅ ${updateResult.rowCount} usuário(s) admin atualizado(s)`);
      
      await client.query('COMMIT');
      console.log('\n✅ Migration executada com sucesso!');
      console.log('📋 Campo role adicionado à tabela users');
      console.log('📋 Usuário admin@econfere.com atualizado para role admin\n');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao executar migration:', error.message);
    
    if (error.code === '28P01') {
      console.error('\n💡 Erro de autenticação!');
    } else if (error.code === '3D000') {
      console.error('\n💡 Banco de dados não encontrado!');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Não foi possível conectar ao PostgreSQL!');
    } else {
      console.error('\n💡 Erro:', error.code || 'Desconhecido');
      console.error('   Detalhes:', error.message);
    }
    
    client.release();
    await pool.end();
    process.exit(1);
  }
}

runMigration();

