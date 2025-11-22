import { Container } from '../../application/Container';

export interface CommitVersionOptions {
  dataset: string;
  author?: string;
  all?: boolean;
}

/**
 * Commit a new version of a dataset
 */
export async function commitVersion(options: CommitVersionOptions): Promise<void> {
  console.log(`Committing new version for dataset: ${options.dataset}`);

  try {
    const container = Container.getInstance();
    const commit = await container.commitVersionUseCase.execute({
      datasetId: options.dataset,
      author: options.author,
      includeAllEntries: options.all || false,
    });

    console.log('✅ Version committed successfully!');
    console.log('\n🔖 Version Details:');
    console.log(`   Version ID:   ${commit.id}`);
    console.log(`   Version Root: ${commit.versionRoot}`);
    console.log(`   Parent Root:  ${commit.parentRoot || '(none - first version)'}`);
    console.log(`   Entries:      ${commit.manifestEntryIds.length}`);
    console.log(`   Signature:    ${commit.signature.substring(0, 32)}...`);
    console.log(`   Public Key:   ${commit.publicKey.substring(0, 32)}...`);
    console.log(`   Author:       ${commit.author || '(anonymous)'}`);
    console.log(`   Created:      ${commit.createdAt.toISOString()}`);
  } catch (error) {
    console.error('❌ Failed to commit version:', (error as Error).message);
    throw error;
  }
}

