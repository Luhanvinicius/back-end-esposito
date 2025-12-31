# Instruções para Executar a Migration

## Opção 1: Executar SQL diretamente (RECOMENDADO)

1. Abra seu cliente PostgreSQL (pgAdmin, DBeaver, DataGrip, etc)
2. Conecte-se ao banco de dados `econfere_db`
3. Abra o arquivo `migrations/002_add_role_to_users.sql`
4. Execute o conteúdo do arquivo SQL

## Opção 2: Via linha de comando (se tiver psql instalado)

```bash
psql -U seu_usuario -d econfere_db -f migrations/002_add_role_to_users.sql
```

## Opção 3: Corrigir .env e executar via npm

1. Edite o arquivo `.env` na pasta `back end`
2. Atualize a linha `DATABASE_URL` com suas credenciais corretas:
   ```
   DATABASE_URL=postgresql://usuario:senha@localhost:5432/econfere_db
   ```
   Substitua:
   - `usuario`: seu usuário do PostgreSQL (geralmente `postgres`)
   - `senha`: sua senha do PostgreSQL
   - `localhost:5432`: host e porta (ajuste se necessário)
   - `econfere_db`: nome do banco de dados

3. Execute novamente:
   ```bash
   npm run migrate:role
   ```

## Verificar se funcionou

Após executar a migration, verifique se a coluna foi adicionada:

```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';
```

Você deve ver a coluna `role` com tipo `character varying(20)` e default `'user'`.









