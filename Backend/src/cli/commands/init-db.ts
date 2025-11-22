import { execSync } from 'child_process';
import * as path from 'path';

/**
 * Initialize database by running Prisma migrations
 */
export async function initDb(): Promise<void> {
  console.log('Initializing Sirius database...');

  try {
    const prismaPath = path.join(__dirname, '../../../node_modules/.bin/prisma');
    const schemaPath = path.join(__dirname, '../../../prisma/schema.prisma');

    console.log('Running Prisma migrations...');
    execSync(`"${prismaPath}" migrate dev --name init --schema="${schemaPath}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '../../..'),
    });

    console.log('✅ Database initialized successfully!');
    console.log('Database location: prisma/sirius.db');
  } catch (error) {
    console.error('❌ Failed to initialize database:', (error as Error).message);
    throw error;
  }
}

