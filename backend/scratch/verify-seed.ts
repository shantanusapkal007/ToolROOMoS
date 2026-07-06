import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
  const projects = await prisma.project.findMany({
    include: {
      customer: true,
      projectCostSummary: true,
      projectTimeline: { orderBy: { transitionedAt: 'asc' } },
      projectActivities: true,
      projectTasks: true,
    },
    orderBy: { projectNumber: 'asc' },
  });

  console.log('\n📊 Seeded Projects Summary:');
  console.log('─'.repeat(100));
  for (const p of projects) {
    console.log(
      `${p.projectNumber} | ${p.currentStage.padEnd(18)} | ${p.customer.companyName.padEnd(25)} | Timelines: ${p.projectTimeline.length} | Tasks: ${p.projectTasks.length} | Revenue: ₹${Number(p.projectCostSummary?.revenue || 0).toLocaleString()}`
    );
  }
  console.log('─'.repeat(100));
  console.log(`Total projects: ${projects.length}`);

  await prisma.$disconnect();
  await pool.end();
}

check();
