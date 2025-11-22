import { ICryptoService } from '../../domain/services/ICryptoService';
import { IKeystoreService } from '../../domain/services/IKeystoreService';
import { Keystore } from '../../domain/entities/Keystore';

/**
 * Use case: Generate a new Ed25519 keypair
 */
export class GenerateKeyUseCase {
  constructor(
    private readonly cryptoService: ICryptoService,
    private readonly keystoreService: IKeystoreService
  ) {}

  async execute(): Promise<Keystore> {
    // Check if keystore already exists
    const existing = await this.keystoreService.load();
    if (existing) {
      throw new Error('Keystore already exists. Delete it first if you want to generate a new one.');
    }

    // Generate new keypair
    const keystore = this.cryptoService.generateKeyPair();

    // Save to file
    await this.keystoreService.save(keystore);

    return keystore;
  }
}

