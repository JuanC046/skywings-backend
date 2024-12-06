import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as path from 'path';

@Injectable()
export class BoardingPassService {
  async generateBoardingPass(data: any): Promise<Buffer> {
    // Crear un nuevo documento PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Buffer para almacenar el PDF
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      console.log('PDF generado');
    });

    // Encabezado
    const imagePath = path.join(__dirname, './templates/skywings.png');
    const image = doc.openImage(imagePath);
    const pageWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const scale = pageWidth / image.width;

    doc.image(imagePath, {
      fit: [pageWidth, image.height * scale],
      align: 'center',
      valign: 'top',
    });
    doc.moveDown(8);
    doc
      .fontSize(20)
      .text('Pasabordo', { align: 'center', underline: true })
      .moveDown(2);

    const boldItalicText = (label: string, value: string) => {
      doc
        .font('Helvetica-Bold')
        .text(label, { continued: true })
        .font('Helvetica-Oblique')
        .text(value);
    };

    // Información del pasajero y vuelo
    doc.fontSize(12).lineGap(6);
    boldItalicText('Nombre del pasajero: ', data.passengerName);
    doc.moveDown(0.5);
    boldItalicText('Código de vuelo: ', data.flightCode);
    doc.moveDown(0.5);
    boldItalicText('Origen: ', data.origin);
    doc.moveDown(0.5);
    boldItalicText('Destino: ', data.destination);
    doc.moveDown(2);

    // Información de salida y llegada
    doc.fontSize(12).lineGap(6);
    boldItalicText(
      'Fecha y hora de salida: ',
      `${data.departureDate}  ${data.departureTime}`,
    );
    doc.moveDown(0.5);
    boldItalicText(
      'Fecha y hora de llegada: ',
      `${data.arrivalDate}  ${data.arrivalTime}`,
    );
    doc.moveDown(2);
    boldItalicText('Número de asiento: ', data.seatNumber);
    doc.moveDown(0.5);
    boldItalicText('Equipaje: ', data.suitcases);
    doc.moveDown(3);

    // Pie de página
    doc
      .fontSize(10)
      .text('¡Gracias por volar con nosotros!', { align: 'center' });

    // Finalizar el documento
    doc.end();

    // Retornar el PDF como un buffer
    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}
