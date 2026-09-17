import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export interface PdfExtractionResult {
  text: string;
  numpages: number;
  info?: Record<string, any>;
}

export async function extractTextFromPdf(base64Data: string): Promise<PdfExtractionResult> {
  try {
    const cleanBase64 = base64Data.replace(/^data:application\/pdf;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const data = await pdfParse(buffer);
    return {
      text: data.text ? data.text.trim() : '',
      numpages: data.numpages || 1,
      info: data.info,
    };
  } catch (err: any) {
    console.warn('PDF extraction notice:', err?.message || err);
    return {
      text: '',
      numpages: 1,
    };
  }
}
