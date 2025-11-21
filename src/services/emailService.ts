import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export class EmailService {
  static async sendReceipt(payment: any, user: any): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: 'Recibo de Pagamento - E-Confere',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1E5AA8 0%, #2B6BC0 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .receipt-details { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .detail-row:last-child { border-bottom: none; }
            .total { font-size: 24px; font-weight: bold; color: #1E5AA8; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>E-Confere</h1>
              <p>Recibo de Pagamento</p>
            </div>
            <div class="content">
              <p>Olá ${user.name},</p>
              <p>Seu pagamento foi processado com sucesso!</p>
              
              <div class="receipt-details">
                <h2>Detalhes do Pagamento</h2>
                <div class="detail-row">
                  <span>ID do Pagamento:</span>
                  <span>${payment.id}</span>
                </div>
                <div class="detail-row">
                  <span>Data:</span>
                  <span>${new Date(payment.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <div class="detail-row">
                  <span>Método de Pagamento:</span>
                  <span>${payment.payment_method}</span>
                </div>
                <div class="detail-row">
                  <span>Valor:</span>
                  <span class="total">R$ ${payment.amount.toFixed(2)}</span>
                </div>
              </div>
              
              <p>Obrigado por usar nossos serviços!</p>
            </div>
            <div class="footer">
              <p>Este é um e-mail automático, por favor não responda.</p>
              <p>&copy; ${new Date().getFullYear()} E-Confere. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Receipt email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending receipt email:', error);
      throw error;
    }
  }

  static async sendPasswordReset(email: string, token: string, name: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Recuperação de Senha - E-Confere',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #1E5AA8 0%, #2B6BC0 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #1E5AA8; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>E-Confere</h1>
              <p>Recuperação de Senha</p>
            </div>
            <div class="content">
              <p>Olá ${name},</p>
              <p>Você solicitou a recuperação de senha. Clique no botão abaixo para redefinir sua senha:</p>
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Redefinir Senha</a>
              </div>
              <p>Se você não solicitou esta recuperação, ignore este e-mail.</p>
              <p>Este link expira em 1 hora.</p>
            </div>
            <div class="footer">
              <p>Este é um e-mail automático, por favor não responda.</p>
              <p>&copy; ${new Date().getFullYear()} E-Confere. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}`);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  }
}

