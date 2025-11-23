import { Container } from '../../application/Container';

/**
 * List all datasets
 */
export async function listDatasets(): Promise<void> {
  console.log('Listing all datasets:\n');

  try {
    const container = Container.getInstance();
    // CLI: Use a placeholder address (in real usage, this comes from wallet)
    const ownerAddress = process.env.SUI_ADDRESS || '0x0000000000000000000000000000000000000000000000000000000000000000';
    
    const datasets = await container.listDatasetsUseCase.execute({ ownerAddress });

    if (datasets.length === 0) {
      console.log('No datasets found.');
      return;
    }

    console.log(`Found ${datasets.length} dataset(s):\n`);

    datasets.forEach((dataset, index) => {
      console.log(`${index + 1}. ${dataset.name}`);
      console.log(`   ID:          ${dataset.id}`);
      console.log(`   Description: ${dataset.description || '(none)'}`);
      console.log(`   Created:     ${dataset.createdAt.toISOString()}`);
      console.log();
    });
  } catch (error) {
    console.error('❌ Failed to list datasets:', (error as Error).message);
    throw error;
  }
}

