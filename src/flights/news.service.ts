import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { New } from './interfaces/new.interface';
import { HttpException } from '@nestjs/common';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}
  async createNew(newData: New): Promise<any> {
    const { title, content, creationDate, flightCode } = newData;
    try {
      const flightNew = await this.prisma.news.create({
        data: {
          flightCode,
          title,
          content,
          creationDate,
        },
      });
      return flightNew;
    } catch (error) {
      console.error('Error al crear la noticia: ', error.message);
      throw new Error(error.message);
    }
  }

  async AllNews() {
    const currentDate = new Date();
    const sevenDaysAgo = new Date(currentDate);
    sevenDaysAgo.setDate(currentDate.getDate() - 7);
    const news = await this.prisma.news.findMany({
      where: { creationDate: { gte: sevenDaysAgo }, erased: false },
      orderBy: { creationDate: 'desc' },
    });

    if (!news) {
      throw new HttpException('No se encontraron noticias.', 404);
    }
    return news;
  }
  async deleteNews(flightCode: string) {
    // Borrado lógico de todas las noticias de un vuelo
    const news = await this.prisma.news.findMany({
      where: { flightCode, erased: false },
    });
    if (!news) {
      throw new HttpException('No se encontraron noticias.', 404);
    }
    try {
      await this.prisma.news.updateMany({
        where: { flightCode },
        data: { erased: true },
      });
      return true;
    } catch (error) {
      console.error('Error al borrar las noticias: ', error.message);
      throw new Error(error.message);
    }
  }
}
