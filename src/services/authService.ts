import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User';
import crypto from 'crypto';

export interface TokenPayload {
  userId: string;
  email: string;
}

export class AuthService {
  static generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }

  static verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
    } catch (error) {
      return null;
    }
  }

  static generateResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    // Implementação será feita no emailService
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    console.log(`Password reset link for ${email}: ${resetUrl}`);
    // TODO: Integrar com emailService
  }
}

