import pool from '../config/database';

export interface Analysis {
  id: string;
  user_id: string;
  tipo: string;
  file_name: string;
  file_path?: string;
  status: 'processing' | 'completed' | 'failed';
  is_free: boolean;
  payment_id?: string;
  result_path?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAnalysisData {
  user_id: string;
  tipo: string;
  file_name: string;
  file_path?: string;
  is_free?: boolean;
  payment_id?: string;
}

export class AnalysisModel {
  static async create(data: CreateAnalysisData): Promise<Analysis> {
    const result = await pool.query(
      `INSERT INTO analyses (user_id, tipo, file_name, file_path, is_free, payment_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.user_id,
        data.tipo,
        data.file_name,
        data.file_path || null,
        data.is_free || false,
        data.payment_id || null
      ]
    );
    
    return result.rows[0];
  }

  static async findById(id: string): Promise<Analysis | null> {
    const result = await pool.query(
      'SELECT * FROM analyses WHERE id = $1',
      [id]
    );
    
    return result.rows[0] || null;
  }

  static async findByUserId(userId: string): Promise<Analysis[]> {
    const result = await pool.query(
      'SELECT * FROM analyses WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    return result.rows;
  }

  static async updateStatus(id: string, status: Analysis['status'], resultPath?: string): Promise<void> {
    await pool.query(
      'UPDATE analyses SET status = $1, result_path = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [status, resultPath || null, id]
    );
  }

  static async updateResultPath(id: string, resultPath: string): Promise<void> {
    await pool.query(
      'UPDATE analyses SET result_path = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [resultPath, id]
    );
  }
}



