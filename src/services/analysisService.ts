import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { AnalysisModel } from '../models/Analysis';

export class AnalysisService {
  static async generateMockReport(analysisId: string, tipo: string, fileName: string): Promise<string> {
    // Criar diretório de resultados se não existir
    const resultsDir = path.join(process.cwd(), 'uploads', 'results');
    await fs.mkdir(resultsDir, { recursive: true });

    // Criar PDF mock
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = 800;
    const margin = 50;
    const lineHeight = 20;

    // Título
    page.drawText('RELATÓRIO DE ANÁLISE', {
      x: margin,
      y,
      size: 24,
      font: boldFont,
      color: rgb(0.12, 0.35, 0.66), // #1E5AA8
    });
    y -= 40;

    // Informações da análise
    page.drawText(`Tipo de Documento: ${tipo}`, {
      x: margin,
      y,
      size: 12,
      font: boldFont,
    });
    y -= lineHeight;

    page.drawText(`Arquivo Analisado: ${fileName}`, {
      x: margin,
      y,
      size: 12,
      font,
    });
    y -= lineHeight * 2;

    page.drawText(`Data da Análise: ${new Date().toLocaleDateString('pt-BR')}`, {
      x: margin,
      y,
      size: 12,
      font,
    });
    y -= lineHeight * 2;

    // Resultados da análise (mock)
    page.drawText('RESULTADOS DA ANÁLISE', {
      x: margin,
      y,
      size: 16,
      font: boldFont,
      color: rgb(0.12, 0.35, 0.66),
    });
    y -= lineHeight * 2;

    const mockResults = [
      '✓ Documento verificado com sucesso',
      '✓ Nenhum ônus encontrado',
      '✓ Matrícula válida e atualizada',
      '✓ Dados do proprietário conferem',
      '✓ Área do imóvel: 150m²',
      '✓ Situação cadastral: Regular',
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

    // Observações
    page.drawText('OBSERVAÇÕES', {
      x: margin,
      y,
      size: 16,
      font: boldFont,
      color: rgb(0.12, 0.35, 0.66),
    });
    y -= lineHeight * 2;

    page.drawText('Este é um relatório gerado automaticamente. A análise foi realizada', {
      x: margin,
      y,
      size: 10,
      font,
    });
    y -= lineHeight;

    page.drawText('usando inteligência artificial e pode conter informações aproximadas.', {
      x: margin,
      y,
      size: 10,
      font,
    });
    y -= lineHeight * 2;

    page.drawText('Para mais informações, entre em contato com nosso suporte.', {
      x: margin,
      y,
      size: 10,
      font,
    });

    // Rodapé
    page.drawText('E-Confere - Análise de Documentos Imobiliários', {
      x: margin,
      y: 30,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Salvar PDF
    const pdfBytes = await pdfDoc.save();
    const resultFileName = `relatorio_${analysisId}_${Date.now()}.pdf`;
    const resultPath = path.join(resultsDir, resultFileName);
    
    await fs.writeFile(resultPath, pdfBytes);

    return resultPath;
  }

  static async processAnalysis(analysisId: string, tipo: string, fileName: string): Promise<string> {
    // Simular processamento (em produção, aqui seria a chamada para a API real)
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Gerar relatório mock
    const resultPath = await this.generateMockReport(analysisId, tipo, fileName);

    // Atualizar status da análise
    await AnalysisModel.updateStatus(analysisId, 'completed', resultPath);

    return resultPath;
  }
}

