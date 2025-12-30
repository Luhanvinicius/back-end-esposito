// Script simples para executar a migration usando a mesma configuração do servidor
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Executando migration 002_add_role_to_users.sql...');
    
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
      console.log('📋 Usuário admin@econfere.com atualizado para role admin');
      
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
      console.error('   Verifique o arquivo .env e atualize o DATABASE_URL com as credenciais corretas.');
      console.error('   Formato: postgresql://usuario:senha@localhost:5432/econfere_db');
    } else if (error.code === '3D000') {
      console.error('\n💡 Banco de dados não encontrado!');
      console.error('   Crie o banco primeiro: CREATE DATABASE econfere_db;');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Não foi possível conectar ao PostgreSQL!');
      console.error('   Verifique se o PostgreSQL está rodando');
    }
    
    client.release();
    await pool.end();
    process.exit(1);
  }
}

runMigration();

