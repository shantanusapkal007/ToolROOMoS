import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const bom = await prisma.billOfMaterialHeader.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  });
  console.log('Latest BOM:', JSON.stringify(bom, null, 2));

  const po = await prisma.purchaseOrderHeader.findFirst({
    where: { poNumber: { startsWith: 'PO-AUTO-' } },
    orderBy: { createdAt: 'desc' },
    include: { items: true }
  });
  console.log('Latest Auto PO:', JSON.stringify(po, null, 2));

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
