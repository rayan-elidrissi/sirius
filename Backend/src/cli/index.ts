#!/usr/bin/env node

import { Command } from 'commander';
import { initDb } from './commands/init-db';
import { generateKey } from './commands/generate-key';
import { createDataset } from './commands/create-dataset';
import { addManifest } from './commands/add-manifest';
import { commitVersion } from './commands/commit-version';
import { listVersions } from './commands/list-versions';
import { verifyChain } from './commands/verify-chain';
import { listDatasets } from './commands/list-datasets';
import { disconnectPrisma } from '../infrastructure/database/PrismaClient';

const program = new Command();

program
  .name('sirius-data')
  .description('Sirius Data Layer - Trust and traceability for Walrus distributed storage')
  .version('1.0.0');

// init-db command
program
  .command('init-db')
  .description('Initialize the database and run migrations')
  .action(async () => {
    try {
      await initDb();
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

// generate-key command
program
  .command('generate-key')
  .description('Generate a new Ed25519 keypair for signing commits')
  .action(async () => {
    try {
      await generateKey();
      await disconnectPrisma();
      process.exit(0);
    } catch (error) {
      await disconnectPrisma();
      process.exit(1);
    }
  });

// create-dataset command
program
  .command('create-dataset')
  .description('Create a new dataset')
  .requiredOption('--name <name>', 'Dataset name')
  .option('--description <description>', 'Dataset description')
  .action(async (options) => {
    try {
      await createDataset(options);
      await disconnectPrisma();
      process.exit(0);
    } catch (error) {
      await disconnectPrisma();
      process.exit(1);
    }
  });

// list-datasets command
program
  .command('list-datasets')
  .description('List all datasets')
  .action(async () => {
    try {
      await listDatasets();
      await disconnectPrisma();
      process.exit(0);
    } catch (error) {
      await disconnectPrisma();
      process.exit(1);
    }
  });

// add-manifest command
program
  .command('add-manifest')
  .description('Add manifest entries to a dataset from a JSON file')
  .requiredOption('--dataset <datasetId>', 'Dataset ID')
  .requiredOption('--entries-file <path>', 'Path to JSON file containing entries')
  .action(async (options) => {
    try {
      await addManifest(options);
      await disconnectPrisma();
      process.exit(0);
    } catch (error) {
      await disconnectPrisma();
      process.exit(1);
    }
  });

// commit-version command
program
  .command('commit-version')
  .description('Commit a new version of a dataset')
  .requiredOption('--dataset <datasetId>', 'Dataset ID')
  .option('--author <author>', 'Author identifier (e.g., Sui address)')
  .option('--all', 'Include all entries (not just uncommitted ones)')
  .action(async (options) => {
    try {
      await commitVersion(options);
      await disconnectPrisma();
      process.exit(0);
    } catch (error) {
      await disconnectPrisma();
      process.exit(1);
    }
  });

// list-versions command
program
  .command('list-versions')
  .description('List all versions for a dataset')
  .requiredOption('--dataset <datasetId>', 'Dataset ID')
  .action(async (options) => {
    try {
      await listVersions(options);
      await disconnectPrisma();
      process.exit(0);
    } catch (error) {
      await disconnectPrisma();
      process.exit(1);
    }
  });

// verify-chain command
program
  .command('verify-chain')
  .description('Verify the integrity of a dataset version chain')
  .requiredOption('--dataset <datasetId>', 'Dataset ID')
  .action(async (options) => {
    try {
      await verifyChain(options);
      await disconnectPrisma();
      process.exit(0);
    } catch (error) {
      await disconnectPrisma();
      process.exit(1);
    }
  });

// Parse arguments
program.parse();

