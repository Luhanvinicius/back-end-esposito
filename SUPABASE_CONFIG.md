# Configuração do Supabase

## ✅ Migration Executada com Sucesso!

A migration foi executada e a coluna `role` foi adicionada à tabela `users`.

## 📝 Configurar o arquivo .env

Para que o servidor backend use o Supabase, atualize o arquivo `.env` na pasta `back end` com:

```env
DATABASE_URL=postgres://postgres.oobevnrndudfxogrsurf:Pyap5vo2CBZLECsj@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

**Importante:** O código já foi atualizado para suportar SSL do Supabase automaticamente.

## 🎯 Próximos Passos

1. ✅ Migration executada
2. Atualize o `.env` com a DATABASE_URL do Supabase (acima)
3. Reinicie o servidor backend se estiver rodando
4. Acesse `/admin` no frontend após fazer login com o usuário admin

## 🔐 Credenciais do Supabase

- **URL:** https://oobevnrndudfxogrsurf.supabase.co
- **Database:** postgres
- **Host:** aws-1-us-east-1.pooler.supabase.com:5432
- **User:** postgres.oobevnrndudfxogrsurf

## ✅ Verificar Migration

Para verificar se a migration funcionou, execute no Supabase SQL Editor:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';
```

Você deve ver a coluna `role` listada.









