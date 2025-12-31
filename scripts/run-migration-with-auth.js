// Script para executar migration com credenciais flexíveis
const { Pool } = require('pg');
require('dotenv').config();

// Permitir credenciais via variáveis de ambiente ou argumentos
const args = process.argv.slice(2);
let dbUser = process.env.DB_USER || 'postgres';
let dbPassword = process.env.DB_PASSWORD || '';
let dbHost = process.env.DB_HOST || 'localhost';
let dbPort = process.env.DB_PORT || '5432';
let dbName = process.env.DB_NAME || 'econfere_db';

// Tentar obter do DATABASE_URL primeiro
let connectionString = process.env.DATABASE_URL;

// Se não tiver DATABASE_URL, construir a partir de variáveis individuais
if (!connectionString || connectionString.includes('usuario:senha')) {
  // Verificar se tem credenciais nas variáveis de ambiente
  if (process.env.DB_USER && process.env.DB_PASSWORD) {
    connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  } else {
    console.log('⚠️  DATABASE_URL não configurado ou contém placeholders');
    console.log('📝 Use uma das opções abaixo:\n');
    console.log('Opção 1: Configure variáveis de ambiente:');
    console.log('   DB_USER=seu_usuario DB_PASSWORD=sua_senha npm run migrate:role\n');
    console.log('Opção 2: Configure DATABASE_URL no arquivo .env:');
    console.log('   DATABASE_URL=postgresql://usuario:senha@localhost:5432/econfere_db\n');
    console.log('Opção 3: Execute o SQL diretamente no seu cliente PostgreSQL:');
    console.log('   Abra o arquivo: migrations/002_add_role_to_users.sql\n');
    process.exit(1);
  }
}

// Se ainda tiver placeholders, pedir para o usuário configurar
if (connectionString.includes('usuario:senha') || connectionString.includes('postgres:')) {
  console.log('❌ Erro: Credenciais do banco de dados não configuradas corretamente!');
  console.log('\n📝 Por favor, edite o arquivo .env e configure:');
  console.log('   DATABASE_URL=postgresql://SEU_USUARIO:SUA_SENHA@localhost:5432/econfere_db');
  console.log('\n   Ou execute o SQL diretamente no seu cliente PostgreSQL');
  console.log('   Arquivo: migrations/002_add_role_to_users.sql\n');
  process.exit(1);
}

console.log('🔗 Conectando ao banco de dados...');
console.log(`   Host: ${dbHost}:${dbPort}`);
console.log(`   Database: ${dbName}`);
console.log(`   User: ${dbUser}\n`);

const pool = new Pool({
  connectionString: connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
      console.error('\n💡 Erro de autenticação! A senha está incorreta.');
      console.error('\n📝 Soluções:');
      console.error('   1. Edite o arquivo .env e atualize DATABASE_URL com a senha correta');
      console.error('   2. Ou execute o SQL diretamente no seu cliente PostgreSQL');
      console.error('      Arquivo: migrations/002_add_role_to_users.sql');
      console.error('   3. Ou use variáveis de ambiente:');
      console.error('      DB_USER=postgres DB_PASSWORD=sua_senha npm run migrate:role');
    } else if (error.code === '3D000') {
      console.error('\n💡 Banco de dados não encontrado!');
      console.error('   Crie o banco primeiro: CREATE DATABASE econfere_db;');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Não foi possível conectar ao PostgreSQL!');
      console.error('   Verifique se o PostgreSQL está rodando');
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









