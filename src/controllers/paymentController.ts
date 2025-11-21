import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PaymentModel } from '../models/Payment';
import { AnalysisModel } from '../models/Analysis';
import { PaymentService } from '../services/paymentService';
import { EmailService } from '../services/emailService';
import { UserModel } from '../models/User';

export class PaymentController {
  static async createPaymentIntent(req: AuthRequest, res: Response) {
    try {
      const { tipo, paymentGateway = 'stripe' } = req.body;
      const userId = req.userId!;

      if (!tipo) {
        return res.status(400).json({ error: 'Tipo de análise é obrigatório' });
      }

      const amount = PaymentService.getServicePrice(tipo);

      let paymentIntent;
      let gatewayPaymentId;

      if (paymentGateway === 'stripe') {
        paymentIntent = await PaymentService.createStripePaymentIntent({
          amount,
          metadata: { userId, tipo },
        });
        gatewayPaymentId = paymentIntent.id;
      } else if (paymentGateway === 'mercadopago') {
        const user = await UserModel.findById(userId);
        paymentIntent = await PaymentService.createMercadoPagoPayment({
          amount,
          metadata: { userId, tipo, email: user?.email },
        });
        gatewayPaymentId = paymentIntent.id?.toString();
      } else {
        return res.status(400).json({ error: 'Gateway de pagamento não suportado' });
      }

      // Salvar pagamento no banco
      const payment = await PaymentService.savePayment({
        user_id: userId,
        amount,
        payment_method: 'credit_card',
        payment_gateway: paymentGateway,
        gateway_payment_id: gatewayPaymentId,
        metadata: { tipo, paymentIntent },
      });

      res.json({
        paymentId: payment.id,
        clientSecret: paymentIntent.client_secret || paymentIntent.id,
        amount,
        paymentGateway,
      });
    } catch (error: any) {
      console.error('Error in createPaymentIntent:', error);
      res.status(500).json({ error: 'Erro ao criar intenção de pagamento' });
    }
  }

  static async confirmPayment(req: AuthRequest, res: Response) {
    try {
      const { paymentId, gatewayPaymentId, paymentGateway } = req.body;
      const userId = req.userId!;

      if (!paymentId || !gatewayPaymentId || !paymentGateway) {
        return res.status(400).json({ error: 'Dados de pagamento incompletos' });
      }

      // Verificar pagamento no gateway
      let isPaid = false;
      if (paymentGateway === 'stripe') {
        isPaid = await PaymentService.verifyStripePayment(gatewayPaymentId);
      } else if (paymentGateway === 'mercadopago') {
        isPaid = await PaymentService.verifyMercadoPagoPayment(gatewayPaymentId);
      }

      if (!isPaid) {
        return res.status(400).json({ error: 'Pagamento não confirmado' });
      }

      // Atualizar status do pagamento
      const payment = await PaymentModel.findById(paymentId);
      if (!payment || payment.user_id !== userId) {
        return res.status(404).json({ error: 'Pagamento não encontrado' });
      }

      await PaymentModel.updateStatus(paymentId, 'completed');

      // Enviar recibo por email
      const user = await UserModel.findById(userId);
      if (user) {
        try {
          await EmailService.sendReceipt(payment, user);
          await PaymentModel.markReceiptSent(paymentId);
        } catch (emailError) {
          console.error('Error sending receipt email:', emailError);
          // Não falhar a requisição se o email falhar
        }
      }

      res.json({
        message: 'Pagamento confirmado com sucesso',
        payment: {
          id: payment.id,
          status: 'completed',
        },
      });
    } catch (error: any) {
      console.error('Error in confirmPayment:', error);
      res.status(500).json({ error: 'Erro ao confirmar pagamento' });
    }
  }

  static async getPaymentHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const payments = await PaymentModel.findByUserId(userId);

      res.json({ payments });
    } catch (error: any) {
      console.error('Error in getPaymentHistory:', error);
      res.status(500).json({ error: 'Erro ao buscar histórico de pagamentos' });
    }
  }

  static async webhookStripe(req: Request, res: Response) {
    try {
      const sig = req.headers['stripe-signature'];
      if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(400).send('Webhook signature missing');
      }

      // Em produção, verificar a assinatura do webhook
      const event = req.body;

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const payment = await PaymentModel.findByGatewayPaymentId('stripe', paymentIntent.id);

        if (payment) {
          await PaymentModel.updateStatus(payment.id, 'completed');

          // Enviar recibo
          const user = await UserModel.findById(payment.user_id);
          if (user) {
            try {
              await EmailService.sendReceipt(payment, user);
              await PaymentModel.markReceiptSent(payment.id);
            } catch (emailError) {
              console.error('Error sending receipt email:', emailError);
            }
          }
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Error in webhookStripe:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  }
}
