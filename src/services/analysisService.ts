import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { AnalysisModel } from '../models/Analysis';

export class AnalysisService {
  static async generateMockReport(analysisId: string, tipo: string, fileName: string): Promise<string> {
    try {
      // Criar diretório de resultados se não existir
      // Usar variável de ambiente ou padrão, com fallback para /tmp no Vercel
      const baseDir = process.env.UPLOAD_DIR || (process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'uploads'));
      const resultsDir = path.join(baseDir, 'results');
      console.log('Criando diretório de resultados:', resultsDir);
      await fs.mkdir(resultsDir, { recursive: true });
      console.log('Diretório criado/verificado com sucesso');

    // Criar PDF mock
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    const margin = 50;
    const lineHeight = 20;

    // Título (sem acentos para evitar problemas de encoding)
    page.drawText('RELATORIO DE ANALISE', {
      x: margin,
      y,
      size: 24,
      font: boldFont,
      color: rgb(0.12, 0.35, 0.66), // #1E5AA8
    });
    y -= 40;

    // Função para sanitizar texto (remover caracteres não suportados)
    const sanitizeText = (text: string): string => {
      return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\x20-\x7E]/g, ''); // Remove caracteres não-ASCII
    };

    // Informações da análise
    page.drawText(`Tipo de Documento: ${sanitizeText(tipo)}`, {
      x: margin,
      y,
      size: 12,
      font: boldFont,
    });
    y -= lineHeight;

    page.drawText(`Arquivo Analisado: ${sanitizeText(fileName)}`, {
      x: margin,
      y,
      size: 12,
      font,
    });
    y -= lineHeight * 2;

    const dataFormatada = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    page.drawText(`Data da Analise: ${dataFormatada}`, {
      x: margin,
      y,
      size: 12,
      font,
    });
    y -= lineHeight * 2;

    // Resultados da análise (mock)
    page.drawText('RESULTADOS DA ANALISE', {
      x: margin,
      y,
      size: 16,
      font: boldFont,
      color: rgb(0.12, 0.35, 0.66),
    });
    y -= lineHeight * 2;

    const mockResults = [
      '[OK] Documento verificado com sucesso',
      '[OK] Nenhum onus encontrado',
      '[OK] Matricula valida e atualizada',
      '[OK] Dados do proprietario conferem',
      '[OK] Area do imovel: 150m2',
      '[OK] Situacao cadastral: Regular',
    ];

    for (const result of mockResults) {
      page.drawText(result, {
        x: margin + 20,
        y,
        size: 11,
        font,
      });
      y -= lineHeight;
    }

    y -= lineHeight * 2;

    // Observacoes
    page.drawText('OBSERVACOES', {
      x: margin,
      y,
      size: 16,
      font: boldFont,
      color: rgb(0.12, 0.35, 0.66),
    });
    y -= lineHeight * 2;

    page.drawText('Este e um relatorio gerado automaticamente. A analise foi realizada', {
      x: margin,
      y,
      size: 10,
      font,
    });
    y -= lineHeight;

    page.drawText('usando inteligencia artificial e pode conter informacoes aproximadas.', {
      x: margin,
      y,
      size: 10,
      font,
    });
    y -= lineHeight * 2;

    page.drawText('Para mais informacoes, entre em contato com nosso suporte.', {
      x: margin,
      y,
      size: 10,
      font,
    });

    // Rodape
    page.drawText('E-Confere - Analise de Documentos Imobiliarios', {
      x: margin,
      y: 30,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

      // Salvar PDF
      console.log('Salvando PDF...');
      const pdfBytes = await pdfDoc.save();
      const resultFileName = `relatorio_${analysisId}_${Date.now()}.pdf`;
      const resultPath = path.join(resultsDir, resultFileName);
      
      console.log('Escrevendo arquivo PDF em:', resultPath);
      await fs.writeFile(resultPath, pdfBytes);
      console.log('PDF salvo com sucesso. Tamanho:', pdfBytes.length, 'bytes');

      return resultPath;
    } catch (error: any) {
      console.error('Erro em generateMockReport:', error);
      console.error('Stack:', error.stack);
      throw error;
    }
  }

  static async processAnalysis(analysisId: string, tipo: string, fileName: string): Promise<string> {
    try {
      console.log('=== INICIANDO PROCESSAMENTO DE ANÁLISE ===');
      console.log('Processando análise:', { analysisId, tipo, fileName });
      
      // Simular processamento (em produção, aqui seria a chamada para a API real)
      console.log('Aguardando 2 segundos (simulação)...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Simulação concluída.');

      // Gerar relatório mock
      console.log('Gerando relatório mock...');
      const resultPath = await this.generateMockReport(analysisId, tipo, fileName);
      console.log('Relatório gerado em:', resultPath);

      // Atualizar status da análise
      console.log('Atualizando status da análise no banco...');
      await AnalysisModel.updateStatus(analysisId, 'completed', resultPath);
      console.log('Status da análise atualizado para completed');

      console.log('=== PROCESSAMENTO CONCLUÍDO ===');
      return resultPath;
    } catch (error: any) {
      console.error('=== ERRO NO PROCESSAMENTO ===');
      console.error('Erro em processAnalysis:', error);
      console.error('Stack:', error.stack);
      throw error;
    }
  }
}



