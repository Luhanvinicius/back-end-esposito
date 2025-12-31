import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { UserModel } from '../models/User';

export const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Não autenticado' });
    }

    const user = await UserModel.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem acessar este recurso.' });
    }

    next();
  } catch (error: any) {
    console.error('Error in isAdmin middleware:', error);
    res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};









