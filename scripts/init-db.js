const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Se DATABASE_URL não estiver definido, usar credenciais padrão
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:1988@localhost:5432/econfere_db';

const pool = new Pool({
  connectionString: databaseUrl,
});

async function initDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Inicializando banco de dados...');
    
    // Habilitar extensão UUID
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    } catch (e) {
      // Extensão pode já existir ou não estar disponível
      console.log('ℹ️  Extensão UUID:', e.message.includes('already exists') ? 'já existe' : 'verificando...');
    }
    
    const sqlFile = path.join(__dirname, '..', 'migrations', '001_initial_schema.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Executar SQL completo usando pg-query-stream ou dividir manualmente
    // Vamos executar em partes lógicas
    
    // 1. Criar tabelas
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email_verified BOOLEAN DEFAULT false,
        reset_password_token VARCHAR(255),
        reset_password_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Criar payments primeiro (sem referência a analyses)
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        analysis_id UUID,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'BRL',
        payment_method VARCHAR(50) NOT NULL,
        payment_gateway VARCHAR(50) NOT NULL,
        gateway_payment_id VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        receipt_sent BOOLEAN DEFAULT false,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Criar analyses
    await client.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tipo VARCHAR(100) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500),
        status VARCHAR(50) DEFAULT 'processing',
        is_free BOOLEAN DEFAULT false,
        payment_id UUID,
        result_path VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Adicionar foreign keys depois
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'analyses_payment_id_fkey'
        ) THEN
          ALTER TABLE analyses ADD CONSTRAINT analyses_payment_id_fkey 
            FOREIGN KEY (payment_id) REFERENCES payments(id);
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'payments_analysis_id_fkey'
        ) THEN
          ALTER TABLE payments ADD CONSTRAINT payments_analysis_id_fkey 
            FOREIGN KEY (analysis_id) REFERENCES analyses(id);
        END IF;
      END $$;
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS free_analyses (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        analysis_id UUID REFERENCES analyses(id),
        week_start_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, week_start_date)
      );
    `);
    
    // 2. Criar índices
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_free_analyses_user_id ON free_analyses(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_free_analyses_week ON free_analyses(user_id, week_start_date);');
    
    // 3. Criar função (usando sintaxe mais simples)
    try {
      await client.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;');
    } catch (e) {
      // Ignorar se não existir
    }
    
    await client.query(`
      CREATE FUNCTION update_updated_at_column()
      RETURNS TRIGGER
      LANGUAGE plpgsql AS
      $func$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $func$;
    `);
    
    // 4. Criar triggers
    // 4. Criar triggers (tentar FUNCTION primeiro, depois PROCEDURE para compatibilidade)
    const triggerSyntax = async (tableName) => {
      try {
        await client.query(`DROP TRIGGER IF EXISTS update_${tableName}_updated_at ON ${tableName};`);
        // Tentar com FUNCTION (PostgreSQL 11+)
        try {
          await client.query(`
            CREATE TRIGGER update_${tableName}_updated_at 
            BEFORE UPDATE ON ${tableName}
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
          `);
        } catch (e) {
          // Se falhar, tentar com PROCEDURE (PostgreSQL < 11)
          await client.query(`
            CREATE TRIGGER update_${tableName}_updated_at 
            BEFORE UPDATE ON ${tableName}
            FOR EACH ROW 
            EXECUTE PROCEDURE update_updated_at_column();
          `);
        }
      } catch (e) {
        console.warn(`Aviso ao criar trigger ${tableName}:`, e.message.substring(0, 80));
      }
    };
    
    await triggerSyntax('users');
    await triggerSyntax('analyses');
    await triggerSyntax('payments');
    
    console.log('✅ Banco de dados inicializado com sucesso!');
    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message);
    client.release();
    await pool.end();
    process.exit(1);
  }
}

initDatabase();

