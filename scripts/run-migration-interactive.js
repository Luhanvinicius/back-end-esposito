// Script interativo para executar migration
const { Pool } = require('pg');
const readline = require('readline');
require('dotenv').config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function runMigration() {
  let connectionString = process.env.DATABASE_URL;
  
  // Verificar se tem placeholders
  if (!connectionString || connectionString.includes('usuario:senha') || connectionString.includes('postgres:')) {
    console.log('⚠️  DATABASE_URL não está configurado corretamente no arquivo .env');
    console.log('📝 Vamos configurar agora:\n');
    
    const dbUser = await question('Usuário do PostgreSQL (padrão: postgres): ') || 'postgres';
    const dbPassword = await question('Senha do PostgreSQL: ');
    const dbHost = await question('Host (padrão: localhost): ') || 'localhost';
    const dbPort = await question('Porta (padrão: 5432): ') || '5432';
    const dbName = await question('Nome do banco (padrão: econfere_db): ') || 'econfere_db';
    
    connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
    console.log('\n');
  }
  
  console.log('🔗 Conectando ao banco de dados...');
  
  const pool = new Pool({
    connectionString: connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

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
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao executar migration:', error.message);
    
    if (error.code === '28P01') {
      console.error('\n💡 Erro de autenticação! A senha está incorreta.');
      console.error('\n💡 Dica: Execute o SQL diretamente no seu cliente PostgreSQL');
      console.error('   Arquivo: migrations/002_add_role_to_users.sql\n');
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
    rl.close();
    process.exit(1);
  }
}

runMigration();








