const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Executando migration 002_add_role_to_users.sql...');
    
    const migrationPath = path.join(__dirname, '../migrations/002_add_role_to_users.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    await client.query(migrationSQL);
    
    console.log('✅ Migration executada com sucesso!');
    console.log('📋 Campo role adicionado à tabela users');
    console.log('📋 Usuário admin@econfere.com atualizado para role admin');
    
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    client.release();
    await pool.end();
    process.exit(1);
  }
}

runMigration();









