import Stripe from 'stripe';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { PaymentModel, CreatePaymentData } from '../models/Payment';

// Configuração Stripe
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

// Configuração Mercado Pago
let mercadoPagoClient: MercadoPagoConfig | null = null;
if (process.env.MERCADOPAGO_ACCESS_TOKEN) {
  mercadoPagoClient = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
  });
}

export interface PaymentIntentData {
  amount: number;
  currency?: string;
  metadata?: any;
}

export class PaymentService {
  static async createStripePaymentIntent(data: PaymentIntentData): Promise<any> {
    if (!stripe) {
      throw new Error('Stripe não configurado');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Converter para centavos
      currency: data.currency || 'brl',
      metadata: data.metadata || {},
    });

    return paymentIntent;
  }

  static async createMercadoPagoPayment(data: PaymentIntentData): Promise<any> {
    if (!mercadoPagoClient) {
      throw new Error('Mercado Pago não configurado');
    }

    const payment = new Payment(mercadoPagoClient);
    
    const paymentData = {
      transaction_amount: data.amount,
      description: 'Análise de documento imobiliário',
      payment_method_id: 'credit_card',
      payer: {
        email: data.metadata?.email || '',
      },
      metadata: data.metadata || {},
    };

    const result = await payment.create({ body: paymentData });
    return result;
  }

  static async verifyStripePayment(paymentIntentId: string): Promise<boolean> {
    if (!stripe) {
      return false;
    }

    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent.status === 'succeeded';
    } catch (error) {
      console.error('Error verifying Stripe payment:', error);
      return false;
    }
  }

  static async verifyMercadoPagoPayment(paymentId: string): Promise<boolean> {
    if (!mercadoPagoClient) {
      return false;
    }

    try {
      const payment = new Payment(mercadoPagoClient);
      const result = await payment.get({ id: paymentId });
      return result.status === 'approved';
    } catch (error) {
      console.error('Error verifying Mercado Pago payment:', error);
      return false;
    }
  }

  static async savePayment(data: CreatePaymentData): Promise<any> {
    return await PaymentModel.create(data);
  }

  static getServicePrice(tipo: string): number {
    const prices: { [key: string]: number } = {
      'matricula-urbana': 14.99,
      'matricula-rural': 14.99,
      'contrato-urbano': 9.99,
      'contrato-rural': 9.99,
      'contrato-aluguel': 9.99,
      'contrato-permuta': 9.99,
      'transcricao-matricula': 19.99,
    };

    return prices[tipo] || 9.99;
  }
}

