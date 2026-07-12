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

injectIntoModel('GoodsReceiptHeader', '  invoiceDate DateTime?');
injectIntoModel('GoodsReceiptItem', '  hsnCode String?\n  warehouseId String?');
injectIntoModel('InventoryBatch', '  bin String?\n  isOffcut Boolean @default(false)');
injectIntoModel('PurchaseOrderHeader', '  vendorGstNumber String?');
injectIntoModel('PurchaseOrderItem', '  gstPercent Decimal @default(0)');

injectIntoModel('VendorBill', '  vendorId String?\n  vendor Vendor? @relation(fields: [vendorId], references: [id])');
injectIntoModel('AccountEntry', '  entryDate DateTime?');

injectIntoModel('MsdrHeader', '  employeeId String?\n  reportDate DateTime @default(now())\n  machine Machine? @relation(fields: [machineId], references: [id])\n  employee Employee? @relation(fields: [employeeId], references: [id])');
injectIntoModel('MsdrOperation', '  materialIssueId String?');

replaceInModel('JobCardTimeLog', 'startTime        DateTime', 'startTime        DateTime @default(now())');
injectIntoModel('AssemblyHeader', '  assemblyName String?');

fs.writeFileSync(schemaPath, schema);
console.log('Schema fixed successfully step 2.');
