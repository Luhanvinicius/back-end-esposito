import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AnalysisModel } from '../models/Analysis';
import { FreeAnalysisModel } from '../models/FreeAnalysis';
import { AnalysisService } from '../services/analysisService';
import { PaymentService } from '../services/paymentService';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';

// Configurar multer para upload de arquivos
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'documents');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'));
    }
  },
});

export class AnalysisController {
  static async createAnalysis(req: AuthRequest, res: Response) {
    try {
      const { tipo } = req.body;
      const file = req.file;

      if (!tipo) {
        return res.status(400).json({ error: 'Tipo de análise é obrigatório' });
      }

      if (!file) {
        return res.status(400).json({ error: 'Arquivo é obrigatório' });
      }

      const userId = req.userId!;
      const force = req.query.force === 'true';

      // Verificar se tem análise gratuita disponível
      let isFree = false;
      let paymentId = undefined;

      if (!force) {
        const hasFreeAnalysis = await FreeAnalysisModel.hasFreeAnalysisThisWeek(userId);
        if (hasFreeAnalysis) {
          // Verificar se precisa pagar
          const price = PaymentService.getServicePrice(tipo);
          return res.status(402).json({
            error: 'Análise gratuita já utilizada esta semana',
            requiresPayment: true,
            amount: price,
            tipo,
          });
        } else {
          isFree = true;
        }
      } else {
        // Se force=true, não é gratuito (já foi pago)
        isFree = false;
      }

      // Criar análise
      const analysis = await AnalysisModel.create({
        user_id: userId,
        tipo,
        file_name: file.originalname,
        file_path: file.path,
        is_free: isFree,
        payment_id: paymentId,
      });

      // Registrar análise gratuita se aplicável
      if (isFree) {
        await FreeAnalysisModel.create(userId, analysis.id);
      }

      // Processar análise (síncrono para retornar PDF diretamente)
      try {
        const resultPath = await AnalysisService.processAnalysis(analysis.id, tipo, file.originalname);
        
        // Retornar PDF diretamente
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="relatorio_${analysis.id}.pdf"`);
        
        const pdfBuffer = fsSync.readFileSync(resultPath);
        res.send(pdfBuffer);
      } catch (error) {
        console.error('Error processing analysis:', error);
        await AnalysisModel.updateStatus(analysis.id, 'failed');
        res.status(500).json({ error: 'Erro ao processar análise' });
      }
    } catch (error: any) {
      console.error('Error in createAnalysis:', error);
      res.status(500).json({ error: 'Erro ao criar análise' });
    }
  }

  static async getAnalysis(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const analysis = await AnalysisModel.findById(id);

      if (!analysis) {
        return res.status(404).json({ error: 'Análise não encontrada' });
      }

      if (analysis.user_id !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      res.json({ analysis });
    } catch (error: any) {
      console.error('Error in getAnalysis:', error);
      res.status(500).json({ error: 'Erro ao buscar análise' });
    }
  }

  static async getAnalysisHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const analyses = await AnalysisModel.findByUserId(userId);

      res.json({ analyses });
    } catch (error: any) {
      console.error('Error in getAnalysisHistory:', error);
      res.status(500).json({ error: 'Erro ao buscar histórico' });
    }
  }

  static async checkFreeAnalysis(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const hasFreeAnalysis = await FreeAnalysisModel.hasFreeAnalysisThisWeek(userId);
      
      res.json({
        hasFreeAnalysis: !hasFreeAnalysis,
        canUseFree: !hasFreeAnalysis,
      });
    } catch (error: any) {
      console.error('Error in checkFreeAnalysis:', error);
      res.status(500).json({ error: 'Erro ao verificar análise gratuita' });
    }
  }

  static async downloadResult(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.userId!;

      const analysis = await AnalysisModel.findById(id);

      if (!analysis) {
        return res.status(404).json({ error: 'Análise não encontrada' });
      }

      if (analysis.user_id !== userId) {
        return res.status(403).json({ error: 'Acesso negado' });
      }

      if (analysis.status !== 'completed' || !analysis.result_path) {
        return res.status(400).json({ error: 'Análise ainda não concluída' });
      }

      // Verificar se o arquivo existe
      try {
        await fs.access(analysis.result_path);
      } catch {
        return res.status(404).json({ error: 'Arquivo não encontrado' });
      }

      res.download(analysis.result_path, `relatorio_${analysis.id}.pdf`);
    } catch (error: any) {
      console.error('Error in downloadResult:', error);
      res.status(500).json({ error: 'Erro ao baixar resultado' });
    }
  }
}

