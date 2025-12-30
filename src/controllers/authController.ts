import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { AuthService } from '../services/authService';
import { EmailService } from '../services/emailService';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e senha são obrigatórios' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
      }

      // Verificar se o usuário já existe
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'Email já cadastrado' });
      }

      // Criar usuário
      const user = await UserModel.create({ name, email, password });

      // Gerar token
      const token = AuthService.generateToken({
        userId: user.id,
        email: user.email,
      });

      res.status(201).json({
        message: 'Usuário criado com sucesso',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
        },
      });
    } catch (error: any) {
      console.error('Error in register:', error);
      res.status(500).json({ error: 'Erro ao criar usuário' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
      }

      // Buscar usuário
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Verificar senha
      const isValidPassword = await UserModel.verifyPassword(user, password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Gerar token
      const token = AuthService.generateToken({
        userId: user.id,
        email: user.email,
      });

      res.json({
        message: 'Login realizado com sucesso',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
        },
      });
    } catch (error: any) {
      console.error('Error in login:', error);
      res.status(500).json({ error: 'Erro ao fazer login' });
    }
  }

  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email é obrigatório' });
      }

      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Por segurança, não revelar se o email existe ou não
        return res.json({ message: 'Se o email existir, você receberá um link de recuperação' });
      }

      // Gerar token de reset
      const resetToken = AuthService.generateResetToken();
      const resetExpires = new Date();
      resetExpires.setHours(resetExpires.getHours() + 1); // Expira em 1 hora

      await UserModel.updateResetToken(user.email, resetToken, resetExpires);

      // Enviar email
      await EmailService.sendPasswordReset(user.email, resetToken, user.name);

      res.json({ message: 'Se o email existir, você receberá um link de recuperação' });
    } catch (error: any) {
      console.error('Error in forgotPassword:', error);
      res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
  }

  static async resetPassword(req: Request, res: Response) {
    try {
      const { token, newPassword, email } = req.body;

      if (!token || !newPassword || !email) {
        return res.status(400).json({ error: 'Token, email e nova senha são obrigatórios' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
      }

      // Buscar usuário pelo email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(400).json({ error: 'Email não encontrado' });
      }

      if (!user.reset_password_token) {
        return res.status(400).json({ error: 'Token não encontrado. Solicite um novo código de recuperação.' });
      }

      // Comparar token (garantir que ambos sejam strings e remover espaços)
      const storedToken = String(user.reset_password_token).trim();
      const receivedToken = String(token).trim();
      
      console.log('Comparando tokens:', { 
        stored: storedToken, 
        received: receivedToken,
        storedLength: storedToken.length,
        receivedLength: receivedToken.length,
        match: storedToken === receivedToken,
        email: email 
      });
      
      if (storedToken !== receivedToken) {
        return res.status(400).json({ error: 'Código inválido. Verifique o código digitado.' });
      }

      if (!user.reset_password_expires || new Date(user.reset_password_expires) < new Date()) {
        return res.status(400).json({ error: 'Código expirado. Solicite um novo código de recuperação.' });
      }

      // Atualizar senha
      await UserModel.updatePassword(user.id, newPassword);

      res.json({ message: 'Senha redefinida com sucesso' });
    } catch (error: any) {
      console.error('Error in resetPassword:', error);
      res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
  }

  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = await UserModel.findById(req.userId!);
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          email_verified: user.email_verified,
          role: user.role || 'user',
        },
      });
    } catch (error: any) {
      console.error('Error in getProfile:', error);
      res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  }

  static async googleLogin(req: Request, res: Response) {
    try {
      const { idToken, email, name, picture } = req.body;

      if (!idToken || !email) {
        return res.status(400).json({ error: 'Token do Google e email são obrigatórios' });
      }

      // Verificar se o usuário já existe
      let user = await UserModel.findByEmail(email);

      if (!user) {
        // Criar novo usuário com Google
        // Gerar senha aleatória (não será usada, mas é obrigatória no modelo)
        const randomPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
        user = await UserModel.create({
          name: name || email.split('@')[0],
          email: email,
          password: randomPassword, // Senha não será usada para login Google
        });
        
        // Marcar email como verificado (Google já verifica)
        await UserModel.updateEmailVerified(user.id, true);
        
        // Se for o email do admin, definir role como admin
        if (email === 'admin@econfere.com') {
          await UserModel.updateRole(user.id, 'admin');
        }
      } else {
        // Se o usuário já existe e é o admin, garantir que tem role admin
        if (email === 'admin@econfere.com' && user.role !== 'admin') {
          await UserModel.updateRole(user.id, 'admin');
        }
      }
      
      // Buscar usuário novamente para garantir que temos o role atualizado
      user = await UserModel.findById(user.id);

      // Gerar token JWT
      const token = AuthService.generateToken({
        userId: user.id,
        email: user.email,
      });

      res.json({
        message: 'Login com Google realizado com sucesso',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role || 'user',
        },
      });
    } catch (error: any) {
      console.error('Error in googleLogin:', error);
      res.status(500).json({ error: 'Erro ao fazer login com Google' });
    }
  }
}

