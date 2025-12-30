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

  static async createAsaasPayment(data: PaymentIntentData & { customerEmail?: string; customerName?: string; customerCpfCnpj?: string }): Promise<any> {
    const asaasApiKey = process.env.ASAAS_API_KEY;
    const asaasEnvironment = process.env.ASAAS_ENVIRONMENT || 'sandbox';
    const baseUrl = asaasEnvironment === 'production' 
      ? 'https://www.asaas.com/api/v3' 
      : 'https://sandbox.asaas.com/api/v3';

    if (!asaasApiKey) {
      console.error('ASAAS_API_KEY não encontrada nas variáveis de ambiente');
      throw new Error('Asaas não configurado. Verifique a variável ASAAS_API_KEY no arquivo .env');
    }
    
    console.log('Configuração Asaas:', { 
      hasApiKey: !!asaasApiKey, 
      environment: asaasEnvironment, 
      baseUrl 
    });

    // Usar cliente fixo do Asaas (mesmo cliente para todos os pagamentos)
    const customerId = process.env.ASAAS_CUSTOMER_ID || 'cus_000007257202';
    console.log('Usando cliente Asaas:', customerId);

    // Criar cobrança com QR code PIX
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // 3 dias a partir de hoje
    
    const paymentPayload = {
      customer: customerId,
      billingType: 'PIX',
      value: parseFloat(data.amount.toFixed(2)), // Valor do plano selecionado
      dueDate: dueDate.toISOString().split('T')[0],
      description: `Análise de documento - ${data.metadata?.tipo || 'Documento'}`,
      externalReference: data.metadata?.userId || undefined,
    };

    console.log('Criando pagamento Asaas:', JSON.stringify(paymentPayload, null, 2));
    
    const paymentResponse = await fetch(`${baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'access_token': asaasApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentPayload),
    });
    
    console.log('Resposta do Asaas:', {
      status: paymentResponse.status,
      statusText: paymentResponse.statusText,
      headers: Object.fromEntries(paymentResponse.headers.entries())
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      console.error('Erro ao criar pagamento Asaas:', {
        status: paymentResponse.status,
        statusText: paymentResponse.statusText,
        error: errorData
      });
      const errorMessage = errorData.errors?.[0]?.description || errorData.message || `Erro ao criar pagamento Asaas (${paymentResponse.status})`;
      throw new Error(errorMessage);
    }

    const paymentData = await paymentResponse.json();
    console.log('Pagamento criado com sucesso:', paymentData.id);

    // Buscar QR code da cobrança
    let qrCode = null;
    let pixCopyPaste = null;
    if (paymentData.id) {
      try {
        const qrCodeResponse = await fetch(`${baseUrl}/payments/${paymentData.id}/pixQrCode`, {
          method: 'GET',
          headers: {
            'access_token': asaasApiKey,
            'Content-Type': 'application/json',
          },
        });

        if (qrCodeResponse.ok) {
          const qrCodeData = await qrCodeResponse.json();
          console.log('Dados completos do QR Code recebidos do Asaas:', JSON.stringify(qrCodeData, null, 2));
          console.log('Dados do QR Code recebidos:', {
            hasEncodedImage: !!qrCodeData.encodedImage,
            hasPayload: !!qrCodeData.payload,
            encodedImageLength: qrCodeData.encodedImage?.length,
            payloadLength: qrCodeData.payload?.length,
            allKeys: Object.keys(qrCodeData)
          });
          
          // O Asaas retorna o QR code como base64, precisa adicionar o prefixo data:image
          if (qrCodeData.encodedImage) {
            // Se já tem o prefixo data:image, usar direto, senão adicionar
            if (qrCodeData.encodedImage.startsWith('data:image')) {
              qrCode = qrCodeData.encodedImage;
            } else {
              qrCode = `data:image/png;base64,${qrCodeData.encodedImage}`;
            }
            console.log('QR Code formatado:', qrCode.substring(0, 50) + '...');
          } else {
            console.warn('encodedImage não encontrado no response do Asaas');
          }
          
          // O payload é o código PIX para copiar e colar
          pixCopyPaste = qrCodeData.payload || paymentData.pixCopyPaste || paymentData.pixCopiaECola;
        } else {
          const errorText = await qrCodeResponse.text();
          console.error('Erro ao buscar QR code do Asaas:', {
            status: qrCodeResponse.status,
            statusText: qrCodeResponse.statusText,
            error: errorText
          });
          // Se não conseguir o QR code, usar o pixCopiaECola da resposta do pagamento
          pixCopyPaste = paymentData.pixCopiaECola || paymentData.pixCopyPaste;
        }
      } catch (error) {
        console.error('Erro ao buscar QR code:', error);
        // Usar dados do pagamento diretamente
        pixCopyPaste = paymentData.pixCopiaECola || paymentData.pixCopyPaste;
      }
    }

    console.log('Retornando dados do pagamento:', {
      paymentId: paymentData.id,
      hasQrCode: !!qrCode,
      qrCodeType: qrCode ? (qrCode.startsWith('data:') ? 'data-uri' : 'raw') : 'null',
      qrCodePreview: qrCode ? qrCode.substring(0, 50) + '...' : 'null',
      hasPixCopyPaste: !!pixCopyPaste
    });

    return {
      id: paymentData.id,
      status: paymentData.status,
      value: paymentData.value,
      dueDate: paymentData.dueDate,
      qrCode: qrCode || null,
      pixCopyPaste: pixCopyPaste || paymentData.pixCopyPaste || null,
      invoiceUrl: paymentData.invoiceUrl,
    };
  }

  static async verifyAsaasPayment(paymentId: string): Promise<boolean> {
    const asaasApiKey = process.env.ASAAS_API_KEY;
    const asaasEnvironment = process.env.ASAAS_ENVIRONMENT || 'sandbox';
    const baseUrl = asaasEnvironment === 'production' 
      ? 'https://www.asaas.com/api/v3' 
      : 'https://sandbox.asaas.com/api/v3';

    if (!asaasApiKey) {
      return false;
    }

    try {
      const response = await fetch(`${baseUrl}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'access_token': asaasApiKey,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const paymentData = await response.json();
        return paymentData.status === 'RECEIVED' || paymentData.status === 'CONFIRMED';
      }
      return false;
    } catch (error) {
      console.error('Error verifying Asaas payment:', error);
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
      // Mapeamento dos planos da página inicial
      'analise-matricula': 14.99,
      'analise-contrato': 9.99,
      'analise-transcricao': 19.99,
    };

    return prices[tipo] || 9.99;
  }
}



