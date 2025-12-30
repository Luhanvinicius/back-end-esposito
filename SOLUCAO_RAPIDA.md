# ⚡ Solução Rápida para a Migration

## 🎯 O Problema

O arquivo `.env` tem credenciais de exemplo (`usuario:senha`) que não funcionam.

## ✅ Solução Mais Rápida (RECOMENDADA)

**Execute o SQL diretamente no seu cliente PostgreSQL:**

1. Abra seu cliente PostgreSQL (pgAdmin, DBeaver, DataGrip, etc)
2. Conecte-se ao banco `econfere_db` (você já tem acesso, pois o servidor está rodando!)
3. Execute este SQL:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user' 
CHECK (role IN ('user', 'admin'));

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@econfere.com';
```

**Pronto!** ✅ A migration foi executada.

---

## 🔧 Alternativa: Script Interativo

Se preferir usar o npm, execute:

```bash
npm run migrate:role
```

O script vai pedir suas credenciais interativamente (não precisa editar o .env).

---

## 📝 Depois de Executar

Verifique se funcionou:

```sql
SELECT id, name, email, role FROM users LIMIT 5;
```

Você deve ver a coluna `role` com valores 'user' ou 'admin'.

---

## 🚀 Próximo Passo

Após executar a migration, acesse `/admin` no frontend após fazer login com o usuário admin!








