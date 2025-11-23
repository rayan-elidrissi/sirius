import { Container } from '../../application/Container';

export interface CreateDatasetOptions {
  name: string;
  description?: string;
}

/**
 * Create a new dataset
 */
export async function createDataset(options: CreateDatasetOptions): Promise<void> {
  console.log(`Creating dataset: ${options.name}`);

  try {
    const container = Container.getInstance();
    // CLI: Use a placeholder address (in real usage, this comes from wallet)
    const ownerAddress = process.env.SUI_ADDRESS || '0x0000000000000000000000000000000000000000000000000000000000000000';
    
    const dataset = await container.createDatasetUseCase.execute({
      name: options.name,
      description: options.description,
      ownerAddress,
    });

    console.log('✅ Dataset created successfully!');
    console.log('\n📊 Dataset Details:');
    console.log(`   ID:          ${dataset.id}`);
    console.log(`   Name:        ${dataset.name}`);
    console.log(`   Description: ${dataset.description || '(none)'}`);
    console.log(`   Created:     ${dataset.createdAt.toISOString()}`);
  } catch (error) {
    console.error('❌ Failed to create dataset:', (error as Error).message);
    throw error;
  }
}

