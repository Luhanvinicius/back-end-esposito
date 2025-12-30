// Script para testar conexão com Supabase
const { Pool } = require('pg');
require('dotenv').config();

// Desabilitar verificação de certificado SSL para Supabase
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DATABASE_URL;

console.log('🔗 Testando conexão com banco de dados...');
console.log('   URL:', connectionString?.replace(/:[^:@]+@/, ':****@')); // Ocultar senha
console.log('');

const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString?.includes('supabase') || process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

async function testConnection() {
  const client = await pool.connect();
  
  try {
    console.log('✅ Conectado ao banco de dados!');
    
    // Testar query simples
    const result = await client.query('SELECT NOW() as current_time, version() as version');
    console.log('✅ Query executada com sucesso!');
    console.log('   Hora do servidor:', result.rows[0].current_time);
    console.log('   Versão PostgreSQL:', result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]);
    
    // Verificar se a tabela users existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      )
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Tabela users existe');
      
      // Verificar se a coluna role existe
      const roleCheck = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND column_name = 'role'
        )
      `);
      
      if (roleCheck.rows[0].exists) {
        console.log('✅ Coluna role existe');
        
        // Contar usuários
        const userCount = await client.query('SELECT COUNT(*) as count FROM users');
        console.log(`✅ Total de usuários: ${userCount.rows[0].count}`);
        
        // Verificar admin
        const adminCheck = await client.query("SELECT id, name, email, role FROM users WHERE email = 'admin@econfere.com'");
        if (adminCheck.rows.length > 0) {
          console.log('✅ Usuário admin encontrado:', adminCheck.rows[0]);
        } else {
          console.log('⚠️  Usuário admin não encontrado');
        }
      } else {
        console.log('⚠️  Coluna role não existe - execute a migration!');
      }
    } else {
      console.log('⚠️  Tabela users não existe');
    }
    
    client.release();
    await pool.end();
    console.log('\n✅ Teste de conexão concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erro ao testar conexão:', error.message);
    console.error('   Código:', error.code);
    console.error('   Detalhes:', error);
    
    client.release();
    await pool.end();
    process.exit(1);
  }
}

testConnection();








