import pool from '../config/database';

export interface FreeAnalysis {
  id: string;
  user_id: string;
  analysis_id?: string;
  week_start_date: Date;
  created_at: Date;
}

export class FreeAnalysisModel {
  static getWeekStartDate(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira
    return new Date(d.setDate(diff));
  }

  static async hasFreeAnalysisThisWeek(userId: string): Promise<boolean> {
    const weekStart = this.getWeekStartDate();
    
    const result = await pool.query(
      'SELECT id FROM free_analyses WHERE user_id = $1 AND week_start_date = $2',
      [userId, weekStart]
    );
    
    return result.rows.length > 0;
  }

  static async create(userId: string, analysisId?: string): Promise<FreeAnalysis> {
    const weekStart = this.getWeekStartDate();
    
    const result = await pool.query(
      `INSERT INTO free_analyses (user_id, analysis_id, week_start_date)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, week_start_date) DO NOTHING
       RETURNING *`,
      [userId, analysisId || null, weekStart]
    );
    
    return result.rows[0];
  }

  static async findByUserId(userId: string): Promise<FreeAnalysis[]> {
    const result = await pool.query(
      'SELECT * FROM free_analyses WHERE user_id = $1 ORDER BY week_start_date DESC',
      [userId]
    );
    
    return result.rows;
  }
}

