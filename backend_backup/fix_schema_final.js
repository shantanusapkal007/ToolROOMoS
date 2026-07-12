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

injectIntoModel('DocumentLink', '  sourceEntityType String?\n  targetEntityType String?');
injectIntoModel('DocumentRegistry', '  createdBy String?');
injectIntoModel('ImportExportJob', '  entityType String?\n  processedRow Int @default(0)');

injectIntoModel('NotificationTemplate', '  templateKey String? @unique');
injectIntoModel('NotificationLog', '  templateKey String?');

injectIntoModel('DocumentSequence', '  zeroPadding Boolean @default(true)\n  financialYear String?');
injectIntoModel('WorkflowInstance', '  entityType String?');

injectIntoModel('GoodsReceiptItem', '  rackLocation String?');
injectIntoModel('PurchaseOrderHeader', '  hsnCode String?');
injectIntoModel('PurchaseOrderItem', '  hsnCode String?');
injectIntoModel('VendorBill', '  gstAmount Decimal @default(0)');
injectIntoModel('AccountEntry', '  referenceDocType String?');
injectIntoModel('InventoryBatch', '  thickness Decimal?');
injectIntoModel('MsdrHeader', '  remarks String?');
injectIntoModel('MsdrOperation', '  setupTime Decimal @default(0)');

// For VendorBill, ensure billNumber is unique
const vendorBillMatch = schema.match(/model VendorBill \{[\s\S]*?\}/);
if (vendorBillMatch) {
  let vbBody = vendorBillMatch[0];
  vbBody = vbBody.replace(/billNumber\s+String\?/, 'billNumber String @unique');
  schema = schema.replace(/model VendorBill \{[\s\S]*?\}/, vbBody);
}

fs.writeFileSync(schemaPath, schema);
console.log('Schema fixed successfully final step.');
