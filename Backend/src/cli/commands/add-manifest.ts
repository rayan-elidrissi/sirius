import { promises as fs } from 'fs';
import { Container } from '../../application/Container';
import { ManifestEntryInput } from '../../application/usecases/AddManifestEntriesUseCase';

export interface AddManifestOptions {
  dataset: string;
  entriesFile: string;
}

/**
 * Add manifest entries from a JSON file
 */
export async function addManifest(options: AddManifestOptions): Promise<void> {
  console.log(`Adding manifest entries to dataset: ${options.dataset}`);

  try {
    // Read entries file
    const fileContent = await fs.readFile(options.entriesFile, 'utf8');
    const entries = JSON.parse(fileContent) as ManifestEntryInput[];

    if (!Array.isArray(entries)) {
      throw new Error('Entries file must contain a JSON array');
    }

    console.log(`Found ${entries.length} entries in file`);

    // Add entries
    const container = Container.getInstance();
    const createdEntries = await container.addManifestEntriesUseCase.execute({
      datasetId: options.dataset,
      entries,
    });

    console.log(`✅ Added ${createdEntries.length} manifest entries`);
    console.log('\n📋 Entries:');
    createdEntries.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.blobId} (${entry.path || 'no path'})`);
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error(`❌ File not found: ${options.entriesFile}`);
    } else if (error instanceof SyntaxError) {
      console.error('❌ Invalid JSON in entries file');
    } else {
      console.error('❌ Failed to add manifest entries:', (error as Error).message);
    }
    throw error;
  }
}

