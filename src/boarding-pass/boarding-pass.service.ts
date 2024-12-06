import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class BoardingPassService {
  async generateBoardingPass(data: any): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: puppeteer.executablePath(), // Usa el ejecutable instalado.
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
      .replace('{{passengerName}}', data.passengerName)
      .replace('{{flightCode}}', data.flightCode)
      .replace('{{origin}}', data.origin)
      .replace('{{departureDate}}', data.departureDate)
      .replace('{{departureTime}}', data.departureTime)
      .replace('{{destination}}', data.destination)
      .replace('{{arrivalDate}}', data.arrivalDate)
      .replace('{{arrivalTime}}', data.arrivalTime)
      .replace('{{seatNumber}}', data.seatNumber)
      .replace('{{suitcases}}', data.suitcases);

    // Configurar el contenido HTML
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generar el PDF
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    console.log('PDF generado');
    await browser.close();
    return Buffer.from(pdfBuffer);
  }
}
