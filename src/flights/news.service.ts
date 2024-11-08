import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { New } from './interfaces/new.interface';
import { HttpException } from '@nestjs/common';

@Injectable()
export class NewsService {
  constructor(private prisma: PrismaService) {}
  async createNew(newData: New): Promise<any> {
    const { title, content, creationDate } = newData;
    try {
      const flightNew = await this.prisma.news.create({
        data: {
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
      where: { creationDate: { gte: sevenDaysAgo } },
      orderBy: { creationDate: 'desc' },
    });

    if (!news) {
      throw new HttpException('No se encontraron noticias.', 404);
    }
    return news;
  }
}
