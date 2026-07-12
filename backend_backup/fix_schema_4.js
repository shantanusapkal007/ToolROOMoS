const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

function injectIntoModel(modelName, linesToInject) {
  const regex = new RegExp(`(model ${modelName} \\{[\\s\\S]*?)(@@map|\\})`);
  schema = schema.replace(regex, `$1${linesToInject}\n  $2`);
}

function replaceInModel(modelName, oldLine, newLine) {
  const modelRegex = new RegExp(`(model ${modelName} \\{[\\s\\S]*?\\})`);
  const match = schema.match(modelRegex);
  if (match) {
    const newModelBody = match[1].replace(oldLine, newLine);
    schema = schema.replace(modelRegex, newModelBody);
  }
}

injectIntoModel('DocumentSequence', '  nextNumber Int @default(1)');

// SystemSetting needs plantId and @@unique
injectIntoModel('SystemSetting', '  plantId String?\n  updatedBy String?');
replaceInModel('SystemSetting', 'settingKey       String               @unique', 'settingKey       String');
injectIntoModel('SystemSetting', '  @@unique([plantId, settingKey])');

// WorkflowInstance
injectIntoModel('WorkflowInstance', '  workflowName String?\n  completedAt DateTime?');
injectIntoModel('WorkflowStepInstance', '  stepOrder Int @default(0)\n  errorPayload Json?\n  completedAt DateTime?\n  startedAt DateTime?');

// PurchaseOrderHeader
injectIntoModel('PurchaseOrderHeader', '  gstPercent Decimal?');

// VendorBill
injectIntoModel('VendorBill', '  dueDate DateTime?');

// AccountEntry
injectIntoModel('AccountEntry', '  category String?');

// InventoryBatch
injectIntoModel('InventoryBatch', '  length Decimal?\n  width Decimal?\n  height Decimal?');

// MsdrHeader
injectIntoModel('MsdrHeader', '  supervisorId String?');

// MsdrOperation
injectIntoModel('MsdrOperation', '  startTime DateTime?\n  endTime DateTime?');

// gstPercent should be nullable in GoodsReceiptItem and PurchaseOrderItem to avoid null assignment error
replaceInModel('GoodsReceiptItem', 'gstPercent Decimal @default(0)', 'gstPercent Decimal?');
replaceInModel('PurchaseOrderItem', 'gstPercent Decimal @default(0)', 'gstPercent Decimal?');


fs.writeFileSync(schemaPath, schema);
console.log('Schema fixed successfully step 4.');
