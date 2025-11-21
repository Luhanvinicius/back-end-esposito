# E-Confere Backend

Backend completo para plataforma de análise de documentos imobiliários.

## 🚀 Funcionalidades

- ✅ Autenticação JWT (cadastro, login, recuperação de senha)
- ✅ Sistema de análise gratuita (1 por semana por usuário)
- ✅ Integração com gateways de pagamento (Stripe, Mercado Pago)
- ✅ Processamento de análises com mock temporário
- ✅ Histórico de análises e pagamentos
- ✅ Envio automático de e-mails (recibos)
- ✅ Upload e download de arquivos PDF

## 📋 Pré-requisitos

- Node.js 18+ 
- PostgreSQL 12+
- npm ou yarn

## 🔧 Instalação

1. Clone o repositório e entre na pasta do backend:
```bash
cd "back end"
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
- `DATABASE_URL`: URL de conexão do PostgreSQL
- `JWT_SECRET`: Chave secreta para JWT
- `EMAIL_*`: Configurações de e-mail
- `STRIPE_SECRET_KEY` ou `MERCADOPAGO_ACCESS_TOKEN`: Chaves do gateway de pagamento

4. Crie o banco de dados:
```sql
CREATE DATABASE econfere_db;
```

5. Execute as migrations:
```bash
psql -U seu_usuario -d econfere_db -f migrations/001_initial_schema.sql
```

Ou use o cliente PostgreSQL de sua preferência para executar o arquivo SQL.

## 🏃 Executando

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

O servidor estará rodando em `http://localhost:8080` (ou na porta definida em `PORT`).

## 📡 Endpoints da API

### Autenticação

- `POST /auth/register` - Cadastro de usuário
- `POST /auth/login` - Login
- `POST /auth/forgot-password` - Solicitar recuperação de senha
- `POST /auth/reset-password` - Redefinir senha
- `GET /auth/profile` - Obter perfil do usuário (requer autenticação)

### Análises

- `POST /api/analise` - Criar nova análise (requer autenticação, upload de arquivo)
- `GET /api/analise` - Listar histórico de análises (requer autenticação)
- `GET /api/analise/:id` - Obter detalhes de uma análise (requer autenticação)
- `GET /api/analise/:id/download` - Download do relatório PDF (requer autenticação)

### Pagamentos

- `POST /api/payment/intent` - Criar intenção de pagamento (requer autenticação)
- `POST /api/payment/confirm` - Confirmar pagamento (requer autenticação)
- `GET /api/payment/history` - Histórico de pagamentos (requer autenticação)
- `POST /api/payment/webhook/stripe` - Webhook do Stripe

## 🔐 Autenticação

A maioria dos endpoints requer autenticação via JWT. Envie o token no header:

```
Authorization: Bearer <seu_token>
```

## 💳 Integração com Pagamentos

### Stripe

1. Obtenha suas chaves em [Stripe Dashboard](https://dashboard.stripe.com)
2. Configure `STRIPE_SECRET_KEY` e `STRIPE_PUBLISHABLE_KEY` no `.env`
3. Configure o webhook em `STRIPE_WEBHOOK_SECRET`

### Mercado Pago

1. Obtenha seu access token em [Mercado Pago](https://www.mercadopago.com.br/developers)
2. Configure `MERCADOPAGO_ACCESS_TOKEN` no `.env`

## 📧 Configuração de E-mail

O sistema usa Nodemailer. Exemplo para Gmail:

1. Ative "Acesso a app menos seguro" ou crie uma "Senha de app"
2. Configure no `.env`:
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu_email@gmail.com
EMAIL_PASS=sua_senha_de_app
```

## 🗄️ Estrutura do Banco de Dados

- `users` - Usuários do sistema
- `analyses` - Análises realizadas
- `payments` - Pagamentos processados
- `free_analyses` - Controle de análises gratuitas

## 📝 Variáveis de Ambiente

Veja o arquivo `.env.example` para todas as variáveis disponíveis.

## 🚢 Deploy

### Render / Railway

1. Configure as variáveis de ambiente na plataforma
2. Configure o build command: `npm run build`
3. Configure o start command: `npm start`
4. Configure a porta: use a variável `PORT` fornecida pela plataforma

### Banco de Dados

Use um serviço gerenciado como:
- [Supabase](https://supabase.com)
- [Neon](https://neon.tech)
- [Railway PostgreSQL](https://railway.app)

## 🔄 Próximos Passos

- [ ] Integração com API real de análise
- [ ] Suporte a Asaas como gateway de pagamento
- [ ] Melhorias no sistema de e-mail
- [ ] Testes automatizados
- [ ] Documentação com Swagger

## 📄 Licença

ISC

