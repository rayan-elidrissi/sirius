/**
 * Script to check datasets and their ownerAddress values
 * Run with: npx ts-node scripts/check-datasets.ts
 */
import { prisma } from '../src/infrastructure/database/PrismaClient';

async function main() {
  console.log('🔍 Checking datasets in database...\n');

  const allDatasets = await prisma.dataset.findMany({
    select: {
      id: true,
      name: true,
      ownerAddress: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`Total datasets: ${allDatasets.length}\n`);

  if (allDatasets.length === 0) {
    console.log('No datasets found.');
    return;
  }

  console.log('📊 Dataset Details:');
  console.log('─'.repeat(80));
  
  allDatasets.forEach((dataset, index) => {
    const hasOwner = dataset.ownerAddress && dataset.ownerAddress.trim() !== '';
    const status = hasOwner ? '✅' : '❌ NO OWNER';
    
    console.log(`${index + 1}. ${status} ${dataset.name}`);
    console.log(`   ID: ${dataset.id}`);
    console.log(`   Owner: ${dataset.ownerAddress || '(NULL/EMPTY)'}`);
    console.log(`   Created: ${dataset.createdAt.toISOString()}`);
    console.log('');
  });

  const withoutOwner = allDatasets.filter(
    (d) => !d.ownerAddress || d.ownerAddress.trim() === ''
  );

  if (withoutOwner.length > 0) {
    console.log(`\n⚠️  WARNING: ${withoutOwner.length} dataset(s) without ownerAddress:`);
    withoutOwner.forEach((d) => {
      console.log(`   - ${d.name} (${d.id})`);
    });
    console.log('\n💡 These datasets will appear for all wallets until they are deleted or updated.');
  } else {
    console.log('\n✅ All datasets have an ownerAddress!');
  }
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

