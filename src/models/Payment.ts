import pool from '../config/database';

export interface Payment {
  id: string;
  user_id: string;
  analysis_id?: string;
  amount: number;
  currency: string;
  payment_method: string;
  payment_gateway: string;
  gateway_payment_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  receipt_sent: boolean;
  metadata?: any;
  created_at: Date;
  updated_at: Date;
}

export interface CreatePaymentData {
  user_id: string;
  analysis_id?: string;
  amount: number;
  currency?: string;
  payment_method: string;
  payment_gateway: string;
  gateway_payment_id?: string;
  metadata?: any;
}

export class PaymentModel {
  static async create(data: CreatePaymentData): Promise<Payment> {
    const result = await pool.query(
      `INSERT INTO payments (user_id, analysis_id, amount, currency, payment_method, payment_gateway, gateway_payment_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        data.user_id,
        data.analysis_id || null,
        data.amount,
        data.currency || 'BRL',
        data.payment_method,
        data.payment_gateway,
        data.gateway_payment_id || null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ]
    );
    
    return result.rows[0];
  }

  static async findById(id: string): Promise<Payment | null> {
    const result = await pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [id]
    );
    
    if (result.rows[0] && result.rows[0].metadata) {
      result.rows[0].metadata = typeof result.rows[0].metadata === 'string' 
        ? JSON.parse(result.rows[0].metadata) 
        : result.rows[0].metadata;
    }
    
    return result.rows[0] || null;
  }

  static async findByUserId(userId: string): Promise<Payment[]> {
    const result = await pool.query(
      'SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    return result.rows.map(row => ({
      ...row,
      metadata: row.metadata && typeof row.metadata === 'string' 
        ? JSON.parse(row.metadata) 
        : row.metadata
    }));
  }

  static async updateStatus(id: string, status: Payment['status']): Promise<void> {
    await pool.query(
      'UPDATE payments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, id]
    );
  }

  static async markReceiptSent(id: string): Promise<void> {
    await pool.query(
      'UPDATE payments SET receipt_sent = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  static async findByGatewayPaymentId(gateway: string, gatewayPaymentId: string): Promise<Payment | null> {
    const result = await pool.query(
      'SELECT * FROM payments WHERE payment_gateway = $1 AND gateway_payment_id = $2',
      [gateway, gatewayPaymentId]
    );
    
    if (result.rows[0] && result.rows[0].metadata) {
      result.rows[0].metadata = typeof result.rows[0].metadata === 'string' 
        ? JSON.parse(result.rows[0].metadata) 
        : result.rows[0].metadata;
    }
    
    return result.rows[0] || null;
  }
}

