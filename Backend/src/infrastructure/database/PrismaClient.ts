import { PrismaClient as Client } from '@prisma/client';

/**
 * Singleton Prisma Client instance
 */
class PrismaClientSingleton {
  private static instance: Client;

  static getInstance(): Client {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new Client({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      });
    }
    return PrismaClientSingleton.instance;
  }

  static async disconnect(): Promise<void> {
    if (PrismaClientSingleton.instance) {
      await PrismaClientSingleton.instance.$disconnect();
    }
  }
}

export const prisma = PrismaClientSingleton.getInstance();
export const disconnectPrisma = PrismaClientSingleton.disconnect.bind(PrismaClientSingleton);

