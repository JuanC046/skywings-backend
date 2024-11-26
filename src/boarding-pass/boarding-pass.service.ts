import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BoardingPassService {
  async generateBoardingPass(data: {
    name: string;
    flight: string;
    seat: string;
  }): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Leer la plantilla HTML
    const templatePath = path.join(
      __dirname,
      'templates',
      'boarding-pass-template.html',
    );
    let html = fs.readFileSync(templatePath, 'utf8');

    // Reemplazar variables en la plantilla
    html = html
      .replace('{{name}}', data.name)
      .replace('{{flight}}', data.flight)
      .replace('{{seat}}', data.seat);

    // Configurar el contenido HTML
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generar el PDF
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    console.log('PDF generado');
    await browser.close();
    return Buffer.from(pdfBuffer);
  }
}
