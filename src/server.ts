import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import routes from './routes';
import pool from './config/database';

dotenv.config();

// Configurar SSL para Supabase (desabilitar verificação de certificado)
if (process.env.DATABASE_URL?.includes('supabase')) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const app = express();
const PORT = process.env.PORT || 8080;

// Middlewares
// Configurar CORS para aceitar múltiplas origens (desenvolvimento e produção)
const allowedOrigins = [
  'http://localhost:3000',
  'https://frontend-analisecontrato.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove valores undefined/null

app.use(cors({
  origin: (origin, callback) => {
    // Permitir requisições sem origin (ex: mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    // Verificar se a origin está na lista de permitidas
    if (allowedOrigins.some(allowed => origin === allowed || origin?.startsWith(allowed))) {
      callback(null, true);
    } else {
      // Log para debug (remover em produção se necessário)
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/', routes);

// Rota de health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

// Middleware de tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Arquivo muito grande' });
    }
  }

  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
  });
});

// Exportar o app para uso no Vercel
export default app;

// Iniciar servidor apenas se não estiver no ambiente Vercel
if (process.env.VERCEL !== '1' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`📡 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  });
}

