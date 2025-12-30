-- Migration: Adicionar campo role na tabela users
-- Execute este arquivo diretamente no seu cliente PostgreSQL (pgAdmin, DBeaver, etc)

-- 1. Adicionar coluna role (se não existir)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' 
CHECK (role IN ('user', 'admin'));

-- 2. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. Atualizar usuário admin existente (se houver)
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@econfere.com';

-- 4. Verificar se funcionou
SELECT id, name, email, role, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 5;
