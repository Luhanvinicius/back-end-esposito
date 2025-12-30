import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { PaymentModel } from '../models/Payment';
import { AnalysisModel } from '../models/Analysis';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export class AdminController {
  // Estatísticas gerais
  static async getStats(req: AuthRequest, res: Response) {
    try {
      const [
        usersCount,
        paymentsCount,
        analysesCount,
        revenueResult,
        recentUsers,
        recentPayments
      ] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM users'),
        pool.query('SELECT COUNT(*) as count FROM payments WHERE status = $1', ['completed']),
        pool.query('SELECT COUNT(*) as count FROM analyses'),
        pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = $1', ['completed']),
        pool.query('SELECT id, name, email, created_at FROM users ORDER BY created_at DESC LIMIT 5'),
        pool.query(`
          SELECT p.id, p.amount, p.status, p.created_at, u.name as user_name, u.email 
          FROM payments p 
          JOIN users u ON p.user_id = u.id 
          ORDER BY p.created_at DESC 
          LIMIT 10
        `)
      ]);

      // Estatísticas por mês (últimos 6 meses)
      const monthlyStats = await pool.query(`
        SELECT 
          DATE_TRUNC('month', created_at) as month,
          COUNT(*) as count,
          COALESCE(SUM(amount), 0) as revenue
        FROM payments
        WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      `);

      res.json({
        stats: {
          totalUsers: parseInt(usersCount.rows[0].count),
          totalPayments: parseInt(paymentsCount.rows[0].count),
          totalAnalyses: parseInt(analysesCount.rows[0].count),
          totalRevenue: parseFloat(revenueResult.rows[0].total || '0'),
        },
        recentUsers: recentUsers.rows,
        recentPayments: recentPayments.rows,
        monthlyStats: monthlyStats.rows.map(row => ({
          month: row.month,
          count: parseInt(row.count),
          revenue: parseFloat(row.revenue || '0')
        }))
      });
    } catch (error: any) {
      console.error('Error in getStats:', error);
      res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
  }

  // Listar todos os usuários
  static async getUsers(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const result = await UserModel.findAll(page, limit, search);

      res.json({
        users: result.users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          email_verified: user.email_verified,
          role: user.role || 'user',
          created_at: user.created_at,
        })),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit)
        }
      });
    } catch (error: any) {
      console.error('Error in getUsers:', error);
      res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
  }

  // Obter detalhes de um usuário
  static async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Buscar análises e pagamentos do usuário
      const [analyses, payments] = await Promise.all([
        AnalysisModel.findByUserId(id),
        PaymentModel.findByUserId(id)
      ]);

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          email_verified: user.email_verified,
          role: user.role || 'user',
          created_at: user.created_at,
        },
        analyses: analyses.length,
        payments: payments.length,
        totalSpent: payments
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
      });
    } catch (error: any) {
      console.error('Error in getUserById:', error);
      res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
  }

  // Atualizar role do usuário
  static async updateUserRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role || !['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Role inválido' });
      }

      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      await UserModel.updateRole(id, role);

      res.json({ message: 'Role atualizado com sucesso' });
    } catch (error: any) {
      console.error('Error in updateUserRole:', error);
      res.status(500).json({ error: 'Erro ao atualizar role' });
    }
  }

  // Deletar usuário
  static async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (id === req.userId) {
        return res.status(400).json({ error: 'Você não pode deletar seu próprio usuário' });
      }

      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      await UserModel.delete(id);

      res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error: any) {
      console.error('Error in deleteUser:', error);
      res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
  }

  // Listar todos os pagamentos
  static async getPayments(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          p.*,
          u.name as user_name,
          u.email as user_email,
          a.tipo as analysis_type
        FROM payments p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN analyses a ON p.analysis_id = a.id
      `;

      const params: any[] = [];
      if (status) {
        query += ' WHERE p.status = $1';
        params.push(status);
      }

      query += ' ORDER BY p.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const [paymentsResult, countResult] = await Promise.all([
        pool.query(query, params),
        pool.query(
          `SELECT COUNT(*) as total FROM payments ${status ? 'WHERE status = $1' : ''}`,
          status ? [status] : []
        )
      ]);

      res.json({
        payments: paymentsResult.rows.map(row => ({
          ...row,
          metadata: row.metadata && typeof row.metadata === 'string' 
            ? JSON.parse(row.metadata) 
            : row.metadata
        })),
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total),
          totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
        }
      });
    } catch (error: any) {
      console.error('Error in getPayments:', error);
      res.status(500).json({ error: 'Erro ao buscar pagamentos' });
    }
  }

  // Listar todas as análises
  static async getAnalyses(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status as string;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          a.*,
          u.name as user_name,
          u.email as user_email
        FROM analyses a
        JOIN users u ON a.user_id = u.id
      `;

      const params: any[] = [];
      if (status) {
        query += ' WHERE a.status = $1';
        params.push(status);
      }

      query += ' ORDER BY a.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
      params.push(limit, offset);

      const [analysesResult, countResult] = await Promise.all([
        pool.query(query, params),
        pool.query(
          `SELECT COUNT(*) as total FROM analyses ${status ? 'WHERE status = $1' : ''}`,
          status ? [status] : []
        )
      ]);

      res.json({
        analyses: analysesResult.rows,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total),
          totalPages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
        }
      });
    } catch (error: any) {
      console.error('Error in getAnalyses:', error);
      res.status(500).json({ error: 'Erro ao buscar análises' });
    }
  }
}

