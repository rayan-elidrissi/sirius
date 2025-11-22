import { Container } from '../../application/Container';

export interface ListVersionsOptions {
  dataset: string;
}

/**
 * List all versions for a dataset
 */
export async function listVersions(options: ListVersionsOptions): Promise<void> {
  console.log(`Listing versions for dataset: ${options.dataset}\n`);

  try {
    const container = Container.getInstance();
    const versions = await container.listVersionsUseCase.execute({
      datasetId: options.dataset,
    });
    if (versions.length === 0) {
      console.log('No versions found for this dataset.');
      return;
    }

    console.log(`Found ${versions.length} version(s):\n`);

    // Build parent-child relationships
    const versionsByRoot = new Map(versions.map((v) => [v.versionRoot, v]));

    versions.forEach((version, index) => {
      const parentExists = version.parentRoot ? versionsByRoot.has(version.parentRoot) : false;

      console.log(`${index + 1}. Version ${version.id}`);
      console.log(`   Root:       ${version.versionRoot}`);
      console.log(`   Parent:     ${version.parentRoot || '(none - first version)'}`);
      if (version.parentRoot && !parentExists) {
        console.log('   ⚠️  Warning: Parent not found in chain!');
      }
      console.log(`   Entries:    ${version.manifestEntryIds.length}`);
      console.log(`   Author:     ${version.author || '(anonymous)'}`);
      console.log(`   Created:    ${version.createdAt.toISOString()}`);
      console.log(`   Signature:  ${version.signature.substring(0, 32)}...`);
      console.log();
    });

    // Display chain structure
    console.log('📊 Chain Structure:');
    const firstVersion = versions.find((v) => v.parentRoot === null);
    if (firstVersion) {
      printChain(firstVersion, versionsByRoot, 0);
    }
  } catch (error) {
    console.error('❌ Failed to list versions:', (error as Error).message);
    throw error;
  }
}

function printChain(
  version: { id: string; versionRoot: string; parentRoot: string | null },
  versionsByRoot: Map<string, { id: string; versionRoot: string; parentRoot: string | null }>,
  depth: number
): void {
  const indent = '  '.repeat(depth);
  console.log(`${indent}└─ ${version.versionRoot.substring(0, 16)}... (${version.id.substring(0, 8)})`);

  // Find children
  const children = Array.from(versionsByRoot.values()).filter(
    (v) => v.parentRoot === version.versionRoot
  );

  children.forEach((child) => {
    printChain(child, versionsByRoot, depth + 1);
  });
}

