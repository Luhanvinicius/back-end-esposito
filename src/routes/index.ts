import express from 'express';
import { AuthController } from '../controllers/authController';
import { AnalysisController, upload } from '../controllers/analysisController';
import { PaymentController } from '../controllers/paymentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Rotas de autenticação
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/forgot-password', AuthController.forgotPassword);
router.post('/auth/reset-password', AuthController.resetPassword);
router.get('/auth/profile', authenticateToken, AuthController.getProfile);

// Rotas de análise
router.post(
  '/api/analise',
  authenticateToken,
  upload.single('arquivo'),
  AnalysisController.createAnalysis
);
router.get('/api/analise', authenticateToken, AnalysisController.getAnalysisHistory);
router.get('/api/analise/check-free', authenticateToken, AnalysisController.checkFreeAnalysis);
router.get('/api/analise/:id', authenticateToken, AnalysisController.getAnalysis);
router.get('/api/analise/:id/download', authenticateToken, AnalysisController.downloadResult);

// Rotas de pagamento
router.post('/api/payment/intent', authenticateToken, PaymentController.createPaymentIntent);
router.post('/api/payment/confirm', authenticateToken, PaymentController.confirmPayment);
router.get('/api/payment/history', authenticateToken, PaymentController.getPaymentHistory);
router.post('/api/payment/webhook/stripe', express.raw({ type: 'application/json' }), PaymentController.webhookStripe);

export default router;

