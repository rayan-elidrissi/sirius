import { Container } from '../../application/Container';

/**
 * Generate a new Ed25519 keypair
 */
export async function generateKey(): Promise<void> {
  console.log('Generating new Ed25519 keypair...');

  try {
    const container = Container.getInstance();
    const keystore = await container.generateKeyUseCase.execute();

    console.log('✅ Keypair generated successfully!');
    console.log('\n📝 Public Key (share this):');
    console.log(keystore.publicKey);
    console.log('\n⚠️  Private key saved to keystore.json (keep this secure!)');
  } catch (error) {
    if ((error as Error).message.includes('already exists')) {
      console.error('❌ Keystore already exists.');
      console.error('   Delete keystore.json first if you want to generate a new keypair.');
    } else {
      console.error('❌ Failed to generate keypair:', (error as Error).message);
    }
    throw error;
  }
}

