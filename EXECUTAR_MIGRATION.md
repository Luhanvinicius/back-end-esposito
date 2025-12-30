# Como Executar a Migration

## ⚠️ Problema de Autenticação?

Se você está recebendo erro de autenticação, use uma das opções abaixo:

---

## ✅ Opção 1: Executar SQL Diretamente (MAIS FÁCIL)

**Esta é a forma mais simples e recomendada!**

1. Abra seu cliente PostgreSQL (pgAdmin, DBeaver, DataGrip, etc)
2. Conecte-se ao banco de dados `econfere_db`
3. Abra o arquivo: `migrations/002_add_role_to_users.sql`
4. Copie e cole o conteúdo no editor SQL
5. Execute o SQL

**Pronto!** A migration foi executada.

---

## ✅ Opção 2: Corrigir o arquivo .env

1. Abra o arquivo `.env` na pasta `back end`
2. Encontre a linha `DATABASE_URL`
3. Atualize com suas credenciais corretas:

```env
DATABASE_URL=postgresql://SEU_USUARIO:SUA_SENHA@localhost:5432/econfere_db
```

**Substitua:**
- `SEU_USUARIO`: seu usuário do PostgreSQL (geralmente `postgres`)
- `SUA_SENHA`: sua senha do PostgreSQL
- `localhost:5432`: ajuste se seu PostgreSQL estiver em outro host/porta
- `econfere_db`: nome do banco de dados

4. Salve o arquivo
5. Execute: `npm run migrate:role`

---

## ✅ Opção 3: Usar Variáveis de Ambiente

Execute o comando com as credenciais:

**Windows (PowerShell):**
```powershell
$env:DB_USER="postgres"; $env:DB_PASSWORD="sua_senha"; npm run migrate:role
```

**Windows (CMD):**
```cmd
set DB_USER=postgres && set DB_PASSWORD=sua_senha && npm run migrate:role
```

**Linux/Mac:**
```bash
DB_USER=postgres DB_PASSWORD=sua_senha npm run migrate:role
```

---

## ✅ Opção 4: Via psql (linha de comando)

Se você tem o `psql` instalado:

```bash
psql -U seu_usuario -d econfere_db -f migrations/002_add_role_to_users.sql
```

---

## 📋 Conteúdo do SQL (para copiar/colar)

Se preferir, aqui está o SQL completo:

```sql
-- Adicionar coluna role
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' 
CHECK (role IN ('user', 'admin'));

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Atualizar admin existente
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@econfere.com';
```

---

## ✅ Verificar se funcionou

Após executar, verifique se a coluna foi criada:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';
```

Você deve ver a coluna `role` listada.

---

## 🎯 Recomendação

**Use a Opção 1** (executar SQL diretamente) - é a mais rápida e não depende de configurações!








