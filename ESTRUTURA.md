# Estrutura do Backend

## 📁 Estrutura de Pastas

```
back end/
├── src/
│   ├── config/
│   │   └── database.ts          # Configuração do PostgreSQL
│   ├── controllers/
│   │   ├── authController.ts    # Autenticação (register, login, reset password)
│   │   ├── analysisController.ts # Análises (criar, listar, download)
│   │   └── paymentController.ts  # Pagamentos (intent, confirm, history)
│   ├── middleware/
│   │   └── auth.ts              # Middleware de autenticação JWT
│   ├── models/
│   │   ├── User.ts              # Modelo de usuário
│   │   ├── Analysis.ts          # Modelo de análise
│   │   ├── Payment.ts           # Modelo de pagamento
│   │   └── FreeAnalysis.ts      # Controle de análises gratuitas
│   ├── routes/
│   │   └── index.ts             # Definição de todas as rotas
│   ├── services/
│   │   ├── authService.ts       # Serviços de autenticação
│   │   ├── emailService.ts      # Envio de e-mails
│   │   ├── paymentService.ts    # Integração com gateways de pagamento
│   │   └── analysisService.ts   # Processamento de análises (mock)
│   ├── utils/
│   │   └── checkFreeAnalysis.ts # Utilitários
│   └── server.ts                # Servidor Express principal
├── migrations/
│   └── 001_initial_schema.sql   # Schema inicial do banco
├── scripts/
│   └── init-db.js               # Script de inicialização do banco
├── package.json
├── tsconfig.json
├── env.example                  # Exemplo de variáveis de ambiente
├── README.md                    # Documentação principal
└── .gitignore

```

## 🔑 Funcionalidades Implementadas

### ✅ Autenticação
- Cadastro de usuário
- Login com JWT
- Recuperação de senha
- Perfil do usuário

### ✅ Análises
- Upload de documentos PDF
- Processamento com mock temporário
- Controle de análise gratuita (1 por semana)
- Histórico de análises
- Download de relatórios

### ✅ Pagamentos
- Integração com Stripe
- Integração com Mercado Pago
- Criação de intenção de pagamento
- Confirmação de pagamento
- Histórico de pagamentos
- Webhook do Stripe

### ✅ E-mail
- Envio de recibos após pagamento
- E-mail de recuperação de senha

## 🗄️ Banco de Dados

### Tabelas
1. **users** - Usuários do sistema
2. **analyses** - Análises realizadas
3. **payments** - Pagamentos processados
4. **free_analyses** - Controle de análises gratuitas semanais

## 📡 Endpoints Principais

### Autenticação
- `POST /auth/register` - Cadastro
- `POST /auth/login` - Login
- `POST /auth/forgot-password` - Recuperar senha
- `POST /auth/reset-password` - Redefinir senha
- `GET /auth/profile` - Perfil (autenticado)

### Análises
- `POST /api/analise` - Criar análise (upload PDF)
- `GET /api/analise` - Histórico
- `GET /api/analise/check-free` - Verificar análise gratuita
- `GET /api/analise/:id` - Detalhes
- `GET /api/analise/:id/download` - Download PDF

### Pagamentos
- `POST /api/payment/intent` - Criar intenção
- `POST /api/payment/confirm` - Confirmar pagamento
- `GET /api/payment/history` - Histórico
- `POST /api/payment/webhook/stripe` - Webhook

## 🔧 Configuração Necessária

1. **Banco de Dados PostgreSQL**
   - Criar database `econfere_db`
   - Executar migration: `npm run init-db`

2. **Variáveis de Ambiente**
   - Copiar `env.example` para `.env`
   - Configurar todas as variáveis necessárias

3. **Gateways de Pagamento**
   - Stripe: Configurar `STRIPE_SECRET_KEY`
   - Mercado Pago: Configurar `MERCADOPAGO_ACCESS_TOKEN`

4. **E-mail**
   - Configurar SMTP no `.env`

## 🚀 Próximos Passos

- [ ] Integração com API real de análise
- [ ] Suporte a Asaas
- [ ] Testes automatizados
- [ ] Documentação Swagger/OpenAPI
- [ ] Rate limiting mais robusto
- [ ] Logging estruturado



