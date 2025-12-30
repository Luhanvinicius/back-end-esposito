import express from 'express';
import { AuthController } from '../controllers/authController';
import { AnalysisController, upload } from '../controllers/analysisController';
import { PaymentController } from '../controllers/paymentController';
import { AdminController } from '../controllers/adminController';
import { authenticateToken } from '../middleware/auth';
import { isAdmin } from '../middleware/isAdmin';

const router = express.Router();

// Rotas de autenticação
router.post('/auth/register', AuthController.register);
router.post('/auth/login', AuthController.login);
router.post('/auth/google', AuthController.googleLogin);
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
router.post('/api/payment/webhook/asaas', express.json(), PaymentController.webhookAsaas);

// Rotas de administração (requer autenticação e role admin)
router.get('/api/admin/stats', authenticateToken, isAdmin, AdminController.getStats);
router.get('/api/admin/users', authenticateToken, isAdmin, AdminController.getUsers);
router.get('/api/admin/users/:id', authenticateToken, isAdmin, AdminController.getUserById);
router.patch('/api/admin/users/:id/role', authenticateToken, isAdmin, AdminController.updateUserRole);
router.delete('/api/admin/users/:id', authenticateToken, isAdmin, AdminController.deleteUser);
router.get('/api/admin/payments', authenticateToken, isAdmin, AdminController.getPayments);
router.get('/api/admin/analyses', authenticateToken, isAdmin, AdminController.getAnalyses);

export default router;

