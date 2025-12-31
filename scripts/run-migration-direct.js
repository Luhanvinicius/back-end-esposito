const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Função para executar a migration diretamente
async function runMigration() {
  // Tentar diferentes formas de obter a connection string
  let connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    // Tentar construir a partir de variáveis individuais
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPassword = process.env.DB_PASSWORD || '';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'econfere_db';
    
    connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  }

  console.log('🔗 Tentando conectar ao banco de dados...');
  console.log(`   Host: ${connectionString.split('@')[1]?.split('/')[0] || 'N/A'}`);
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  const client = await pool.connect();
  
  try {
    console.log('✅ Conectado ao banco de dados!');
    console.log('🔄 Executando migration 002_add_role_to_users.sql...');
    
    // Executar cada comando separadamente para melhor tratamento de erros
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
      console.error('\n💡 Erro de autenticação! Verifique:');
      console.error('   - Se a senha do PostgreSQL está correta no arquivo .env');
      console.error('   - Se o usuário do banco está correto');
      console.error('   - Se o DATABASE_URL está configurado corretamente');
    } else if (error.code === '3D000') {
      console.error('\n💡 Banco de dados não encontrado!');
      console.error('   Crie o banco de dados primeiro: CREATE DATABASE econfere_db;');
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









