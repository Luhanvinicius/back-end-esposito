# 🚀 Deploy Backend no Vercel - Guia Rápido

## ✅ O que foi configurado

1. ✅ Arquivo `api/index.ts` criado para função serverless
2. ✅ `server.ts` modificado para exportar o app Express
3. ✅ `vercel.json` configurado corretamente
4. ✅ Diretório de uploads ajustado para usar `/tmp` no Vercel
5. ✅ Documentação criada

## 📝 Passos para Deploy

### 1. No Vercel Dashboard

1. **Criar Novo Projeto**
   - Clique em "Add New Project"
   - Importe o repositório do GitHub
   - Configure:
     - **Root Directory**: `back end`
     - **Framework Preset**: Other
     - **Build Command**: `npm run build` (ou deixe vazio, o Vercel detecta automaticamente)
     - **Output Directory**: (deixe vazio)
     - **Install Command**: `npm install`

### 2. Variáveis de Ambiente

Adicione todas as variáveis do arquivo `VARIAVEIS_VERCEL.txt` no painel do Vercel:
- Settings > Environment Variables

**⚠️ IMPORTANTE**: 
- Ajuste `FRONTEND_URL` para a URL do seu frontend no Vercel
- Use `UPLOAD_DIR=/tmp/uploads` (já configurado no arquivo)

### 3. Deploy

Clique em "Deploy" e aguarde o build completar.

### 4. Testar

Após o deploy, teste:
```
https://seu-backend.vercel.app/health
```

## 🔧 Estrutura de Arquivos

```
back end/
├── api/
│   └── index.ts          # ✅ Ponto de entrada serverless
├── src/
│   ├── server.ts         # ✅ Exporta app Express
│   └── ...
├── vercel.json           # ✅ Configuração do Vercel
├── package.json
└── tsconfig.json
```

## 📚 Documentação Completa

Veja `DEPLOY_VERCEL.md` para instruções detalhadas.

## ⚠️ Observações Importantes

1. **Uploads**: No Vercel, arquivos são temporários. Considere usar um serviço de storage (S3, Cloudinary, etc.) para produção.

2. **Timeout**: Funções serverless têm limite de tempo. Para operações longas, considere o plano Pro.

3. **CORS**: Certifique-se de que `FRONTEND_URL` está correto para permitir requisições do frontend.

4. **Database**: Certifique-se de que o banco de dados permite conexões externas.


