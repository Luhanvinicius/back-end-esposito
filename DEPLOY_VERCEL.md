# Deploy do Backend no Vercel

Este documento contém as instruções para fazer o deploy do backend no Vercel.

## 📋 Pré-requisitos

1. Conta no Vercel
2. Repositório GitHub com o código do backend
3. Banco de dados PostgreSQL configurado (Supabase ou outro)

## 🚀 Passos para Deploy

### 1. Preparar o Repositório

Certifique-se de que o código está no GitHub e que a pasta `back end` está na raiz do repositório.

### 2. Criar Novo Projeto no Vercel

1. Acesse [vercel.com](https://vercel.com)
2. Clique em "Add New Project"
3. Importe o repositório do GitHub
4. Configure o projeto:
   - **Framework Preset**: Other
   - **Root Directory**: `back end`
   - **Build Command**: `npm run build`
   - **Output Directory**: (deixe vazio)
   - **Install Command**: `npm install`

### 3. Configurar Variáveis de Ambiente

No painel do Vercel, vá em **Settings > Environment Variables** e adicione todas as variáveis abaixo:

#### Configuração do Servidor
```
PORT=8080
NODE_ENV=production
```

#### Banco de Dados
```
DATABASE_URL=postgresql://usuario:senha@host:porta/database
```

#### JWT
```
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRES_IN=7d
```

#### Email (Gmail)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app
EMAIL_FROM=noreply@econfere.com
```

#### Frontend URL
```
FRONTEND_URL=https://seu-frontend.vercel.app
```

#### Payment Gateway - Asaas
```
ASAAS_API_KEY=$aact_hmlg_000MzkwODA2MWY2OGM3MWRlMDU2NWM3MzJlNzZmNGZhZGY6OjIxOTU0ZDgwLTRhNzAtNDYyOS1iZWFlLWVjNmFhNGMxM2FiOTo6JGFhY2hfMTM0NTBlYmQtNGUzNi00ZWZhLTlkOTctMDE5NTMzZjIwZjIy
ASAAS_ENVIRONMENT=sandbox
ASAAS_CUSTOMER_ID=cus_000007257202
```

#### Upload de Arquivos
```
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/tmp/uploads
```

**⚠️ IMPORTANTE**: No Vercel, use `/tmp/uploads` para o diretório de uploads, pois é o único diretório gravável no ambiente serverless.

### 4. Ajustar CORS

Certifique-se de que a variável `FRONTEND_URL` está configurada com a URL do seu frontend no Vercel.

### 5. Fazer Deploy

1. Clique em "Deploy"
2. Aguarde o build completar
3. Verifique os logs se houver erros

### 6. Verificar Deploy

Após o deploy, teste o endpoint de health check:
```
https://seu-backend.vercel.app/health
```

## 📝 Estrutura de Arquivos

```
back end/
├── api/
│   └── index.ts          # Ponto de entrada para Vercel
├── src/
│   ├── server.ts         # App Express (exportado)
│   ├── routes/
│   ├── controllers/
│   ├── services/
│   └── ...
├── vercel.json           # Configuração do Vercel
├── package.json
└── tsconfig.json
```

## 🔧 Troubleshooting

### Erro: "Cannot find module"
- Verifique se todas as dependências estão no `package.json`
- Execute `npm install` localmente para garantir que não há dependências faltando

### Erro: "Database connection failed"
- Verifique se a `DATABASE_URL` está correta
- Certifique-se de que o banco de dados permite conexões externas
- Para Supabase, verifique se o SSL está configurado corretamente

### Erro: "Upload directory not writable"
- No Vercel, use `/tmp/uploads` ao invés de `./uploads`
- O diretório `/tmp` é o único gravável no ambiente serverless

### Timeout
- O Vercel tem limite de 10 segundos para funções Hobby
- Para funções mais longas, considere usar o plano Pro

## 📚 Recursos

- [Documentação do Vercel](https://vercel.com/docs)
- [Vercel Node.js Runtime](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js)

