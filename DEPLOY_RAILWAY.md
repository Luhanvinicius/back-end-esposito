# 🚂 Deploy do Backend no Railway

Este guia específico explica como fazer o deploy do backend no Railway.

## 📋 Pré-requisitos

1. Conta no [Railway](https://railway.app)
2. Repositório no GitHub/GitLab/Bitbucket
3. Todas as variáveis de ambiente do arquivo `.env`

## 🚀 Passo a Passo

### 1. Criar Novo Projeto no Railway

1. Acesse [railway.app](https://railway.app) e faça login
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Escolha seu repositório

### 2. Adicionar Serviço Backend

1. No projeto criado, clique em **"New"** > **"Service"**
2. Selecione **"GitHub Repo"** novamente (se necessário)
3. Configure:
   - **Root Directory**: `back end`
   - O Railway detectará automaticamente que é um projeto Node.js

### 3. Configurar Build e Start

O Railway detecta automaticamente, mas você pode configurar manualmente:

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

### 4. Adicionar Banco de Dados PostgreSQL

1. No mesmo projeto, clique em **"New"** > **"Database"** > **"PostgreSQL"**
2. Railway criará um banco PostgreSQL automaticamente
3. Copie a `DATABASE_URL` gerada (aparecerá nas variáveis de ambiente)

### 5. Configurar Variáveis de Ambiente

No serviço do backend, vá em **"Variables"** e adicione:

```env
# Server
PORT=8080
NODE_ENV=production

# Database (use a DATABASE_URL gerada pelo Railway)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=luhanvini.dev@gmail.com
EMAIL_PASS=vgpmfcrd uxgj jjff
EMAIL_FROM=noreply@econfere.com

# Asaas
ASAAS_API_KEY=$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjIxOTU0ZDgwLTRhNzAtNDYyOS1iZWFlLWVjNmFhNGMxM2FiOTo6JGFhY2hfMTM0NTBlYmQtNGUzNi00ZWZhLTlkOTctMDE5NTMzZjIwZjIy
ASAAS_ENVIRONMENT=sandbox
ASAAS_CUSTOMER_ID=cus_000007257202

# Frontend (substitua pela URL do seu frontend no Vercel)
FRONTEND_URL=https://seu-projeto.vercel.app

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
```

**⚠️ IMPORTANTE:**
- Substitua `FRONTEND_URL` pela URL real do seu frontend
- Mantenha todas as variáveis **exatamente** como estão no `.env` local
- Use `${{Postgres.DATABASE_URL}}` para referenciar o banco criado no Railway

### 6. Configurar Volume para Uploads (Opcional)

Para persistir os arquivos enviados:

1. No serviço do backend, vá em **"Settings"** > **"Volumes"**
2. Clique em **"Add Volume"**
3. Configure:
   - **Mount Path**: `/app/uploads`
   - **Volume Size**: 1GB (ou mais, conforme necessário)

### 7. Deploy

1. O Railway fará deploy automaticamente após o push
2. Aguarde o build completar
3. Vá em **"Settings"** > **"Networking"**
4. Clique em **"Generate Domain"** para obter uma URL pública
5. Copie a URL gerada (ex: `https://seu-projeto.up.railway.app`)

### 8. Atualizar Frontend

1. No Vercel, vá em **Settings** > **Environment Variables**
2. Atualize `NEXT_PUBLIC_API_URL` com a URL do Railway:
   ```
   NEXT_PUBLIC_API_URL=https://seu-projeto.up.railway.app
   ```
3. Faça um novo deploy do frontend

## 🔍 Verificar Deploy

1. Acesse a URL do backend: `https://seu-projeto.up.railway.app`
2. Você deve ver uma resposta JSON ou uma mensagem de erro (normal se não houver rota raiz)
3. Teste um endpoint: `https://seu-projeto.up.railway.app/api/health` (se existir)

## 📊 Monitoramento

- **Logs**: Clique em **"View Logs"** no serviço para ver os logs em tempo real
- **Metrics**: Veja CPU, memória e tráfego em **"Metrics"**
- **Deployments**: Veja histórico de deploys em **"Deployments"**

## 🔧 Troubleshooting

### Build falha

- Verifique os logs no Railway
- Certifique-se de que `package.json` está correto
- Verifique se todas as dependências estão listadas

### Servidor não inicia

- Verifique os logs de runtime
- Certifique-se de que `PORT` está configurado
- Verifique se `DATABASE_URL` está correta

### Banco de dados não conecta

- Verifique se o banco PostgreSQL foi criado
- Certifique-se de que `DATABASE_URL` está usando `${{Postgres.DATABASE_URL}}`
- Verifique os logs do banco

## ✅ Pronto!

Seu backend está no ar! Use a URL gerada no `NEXT_PUBLIC_API_URL` do frontend.





