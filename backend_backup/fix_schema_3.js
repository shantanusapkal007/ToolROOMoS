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

injectIntoModel('GoodsReceiptHeader', '  customFields Json?\n  invoiceDate DateTime?');
injectIntoModel('GoodsReceiptItem', '  gstPercent Decimal @default(0)');
injectIntoModel('InventoryBatch', '  bin String?\n  isReusable Boolean @default(false)');
injectIntoModel('PurchaseOrderHeader', '  costCentre String?');
injectIntoModel('VendorBill', '  billDate DateTime?\n  poHeader PurchaseOrderHeader @relation(fields: [poHeaderId], references: [id])');
injectIntoModel('AccountEntry', '  entryType String?');
injectIntoModel('MsdrHeader', '  shift String?');
injectIntoModel('MsdrOperation', '  inventoryBatchId String?');
replaceInModel('JobCardTimeLog', 'startTime        DateTime @default(now())', 'startTime        DateTime? @default(now())');

// Append new models
const platformModels = `

model Comment {
  id               String               @id @default(uuid())
  documentId       String
  documentType     String
  content          String
  createdAt        DateTime             @default(now())
  updatedAt        DateTime             @updatedAt
  createdBy        String?

  @@map("comments")
}

model DocumentLink {
  id               String               @id @default(uuid())
  sourceId         String
  sourceType       String
  targetId         String
  targetType       String
  relationType     String               @default("REFERENCE")
  createdAt        DateTime             @default(now())

  @@map("document_links")
}

model DocumentRegistry {
  id               String               @id @default(uuid())
  documentNumber   String               @unique
  documentType     String
  status           String               @default("ACTIVE")
  createdAt        DateTime             @default(now())
  updatedAt        DateTime             @updatedAt

  @@map("document_registries")
}

model ImportExportJob {
  id               String               @id @default(uuid())
  jobType          String
  status           String               @default("PENDING")
  totalRecords     Int                  @default(0)
  processedRecords Int                  @default(0)
  failedRecords    Int                  @default(0)
  errors           Json?
  createdAt        DateTime             @default(now())
  updatedAt        DateTime             @updatedAt

  @@map("import_export_jobs")
}

model NotificationTemplate {
  id               String               @id @default(uuid())
  templateCode     String               @unique
  subject          String
  body             String
  createdAt        DateTime             @default(now())

  @@map("notification_templates")
}

model NotificationLog {
  id               String               @id @default(uuid())
  userId           String
  templateCode     String
  status           String               @default("SENT")
  createdAt        DateTime             @default(now())

  @@map("notification_logs")
}

model DocumentSequence {
  id               String               @id @default(uuid())
  documentType     String               @unique
  prefix           String
  currentNumber    Int                  @default(0)
  padding          Int                  @default(4)
  suffix           String?
  createdAt        DateTime             @default(now())
  updatedAt        DateTime             @updatedAt

  @@map("document_sequences")
}

model SystemSetting {
  id               String               @id @default(uuid())
  settingKey       String               @unique
  settingValue     Json
  description      String?
  createdAt        DateTime             @default(now())
  updatedAt        DateTime             @updatedAt

  @@map("system_settings")
}

model WorkflowInstance {
  id               String               @id @default(uuid())
  workflowId       String
  documentId       String
  documentType     String
  status           String               @default("IN_PROGRESS")
  createdAt        DateTime             @default(now())
  updatedAt        DateTime             @updatedAt
  steps            WorkflowStepInstance[]

  @@map("workflow_instances")
}

model WorkflowStepInstance {
  id               String               @id @default(uuid())
  workflowInstanceId String
  stepName         String
  status           String               @default("PENDING")
  approverId       String?
  comments         String?
  createdAt        DateTime             @default(now())
  updatedAt        DateTime             @updatedAt
  workflowInstance WorkflowInstance     @relation(fields: [workflowInstanceId], references: [id])

  @@map("workflow_step_instances")
}
`;

schema += platformModels;
fs.writeFileSync(schemaPath, schema);
console.log('Schema fixed successfully step 3.');
