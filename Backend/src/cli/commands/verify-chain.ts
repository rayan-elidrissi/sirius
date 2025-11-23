import { Container } from '../../application/Container';

export interface VerifyChainOptions {
  dataset: string;
}

/**
 * Verify the integrity of a dataset's version chain
 */
export async function verifyChain(options: VerifyChainOptions): Promise<void> {
  console.log(`Verifying version chain for dataset: ${options.dataset}\n`);

  try {
    const container = Container.getInstance();
    const result = await container.verifyChainUseCase.execute({
      datasetId: options.dataset,
    });

    console.log('🔍 Verification Results:\n');
    console.log(`Dataset:  ${result.datasetId}`);
    console.log(`Versions: ${result.versionCount}`);
    console.log(`Status:   ${result.valid ? '✅ VALID' : '❌ INVALID'}\n`);

    if (result.versions.length === 0) {
      console.log('No versions to verify.');
      return;
    }

    console.log('📋 Version Details:\n');
    result.versions.forEach((version, index) => {
      const allChecks = version.merkleRootValid && version.signatureValid && version.parentLinkValid;

      console.log(`${index + 1}. ${version.versionId}`);
      console.log(`   Root:         ${version.versionRoot}`);
      console.log(`   Parent:       ${version.parentRoot || '(none)'}`);
      console.log(`   Merkle Root:  ${version.merkleRootValid ? '✅' : '❌'} ${version.merkleRootValid ? 'Valid' : 'INVALID'}`);
      console.log(`   Signature:    ${version.signatureValid ? '✅' : '❌'} ${version.signatureValid ? 'Valid' : 'INVALID'}`);
      console.log(`   Parent Link:  ${version.parentLinkValid ? '✅' : '❌'} ${version.parentLinkValid ? 'Valid' : 'INVALID'}`);
      console.log(`   Overall:      ${allChecks ? '✅ VALID' : '❌ INVALID'}`);

      if (version.errors.length > 0) {
        console.log('   Errors:');
        version.errors.forEach((error) => {
          console.log(`     - ${error}`);
        });
      }
      console.log();
    });

    if (!result.valid) {
      console.log('❌ Chain validation failed!');
      console.log('Errors:');
      result.errors.forEach((error) => {
        console.log(`  - ${error}`);
      });
    } else {
      console.log('✅ All versions verified successfully!');
    }
  } catch (error) {
    console.error('❌ Failed to verify chain:', (error as Error).message);
    throw error;
  }
}

