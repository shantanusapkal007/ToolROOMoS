const fs = require('fs');
const file = 'e:/projects/enterprise toolroom/ToolRoomOS/backend/prisma/schema.prisma';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('  @@map("project_activities")', '  @@map("project_activities")\n  @@index([projectId])');
content = content.replace('  @@map("project_cost_events")', '  @@map("project_cost_events")\n  @@index([projectId])');
content = content.replace('  @@map("inventory_batches")', '  @@map("inventory_batches")\n  @@index([materialId])\n  @@index([grnItemId])');
content = content.replace('  @@map("material_issue_items")', '  @@map("material_issue_items")\n  @@index([issueHeaderId])\n  @@index([inventoryBatchId])');

fs.writeFileSync(file, content);
console.log('Indexes added successfully');
