const fs = require('fs');
const path = require('path');

const migrationsDir = path.join(__dirname);

function getFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            if (file !== 'phase1_fixes') {
                results = results.concat(getFiles(filePath));
            }
        } else if (file.endsWith('.up.sql')) {
            results.push(filePath);
        }
    });
    return results;
}

const upSqlFiles = getFiles(migrationsDir);

const tables = {};

upSqlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const statements = content.split(';');
    statements.forEach(stmt => {
        const createTableMatch = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s*\(([\s\S]+)\)/i);
        if (createTableMatch) {
            const tableName = createTableMatch[1].trim();
            const columnsStr = createTableMatch[2];
            tables[tableName] = { file: path.relative(migrationsDir, file), cols: columnsStr };
        }
    });
});

let upSql = '';
let downSql = '';

const report = {};

for (const [tableName, data] of Object.entries(tables)) {
    const cols = data.cols.toLowerCase();
    const missing = [];
    if (!cols.includes('tenant_id')) missing.push('tenant_id UUID');
    if (!cols.includes('company_id')) missing.push('company_id UUID');
    if (!cols.includes('created_at')) missing.push('created_at TIMESTAMPTZ DEFAULT NOW()');
    if (!cols.includes('updated_at')) missing.push('updated_at TIMESTAMPTZ DEFAULT NOW()');
    if (!cols.includes('deleted_at')) missing.push('deleted_at TIMESTAMPTZ');
    if (!cols.includes('created_by')) missing.push('created_by UUID');
    if (!cols.includes('updated_by')) missing.push('updated_by UUID');
    if (!cols.includes('deleted_by')) missing.push('deleted_by UUID');
    if (!cols.includes('version')) missing.push('version INT DEFAULT 1');
    
    // Ignore global tables for company_id and tenant_id
    if (tableName === 'tenants' || tableName === 'users') {
        const idxT = missing.indexOf('tenant_id UUID');
        if (idxT > -1) missing.splice(idxT, 1);
        const idxC = missing.indexOf('company_id UUID');
        if (idxC > -1) missing.splice(idxC, 1);
    }
    
    if (missing.length > 0) {
        report[tableName] = missing.map(m => m.split(' ')[0]);
        
        upSql += `-- Fixes for ${tableName}\n`;
        missing.forEach(colDef => {
            upSql += `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS ${colDef};\n`;
        });
        
        // Add indices for the new columns
        if (missing.find(m => m.startsWith('tenant_id'))) upSql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_tenant_id ON ${tableName}(tenant_id);\n`;
        if (missing.find(m => m.startsWith('company_id'))) upSql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_company_id ON ${tableName}(company_id);\n`;
        if (missing.find(m => m.startsWith('deleted_at'))) upSql += `CREATE INDEX IF NOT EXISTS idx_${tableName}_deleted_at ON ${tableName}(deleted_at);\n`;
        
        upSql += '\n';
        
        downSql += `-- Revert fixes for ${tableName}\n`;
        missing.forEach(colDef => {
            const colName = colDef.split(' ')[0];
            downSql += `ALTER TABLE ${tableName} DROP COLUMN IF EXISTS ${colName};\n`;
        });
        
        if (missing.find(m => m.startsWith('tenant_id'))) downSql += `DROP INDEX IF EXISTS idx_${tableName}_tenant_id;\n`;
        if (missing.find(m => m.startsWith('company_id'))) downSql += `DROP INDEX IF EXISTS idx_${tableName}_company_id;\n`;
        if (missing.find(m => m.startsWith('deleted_at'))) downSql += `DROP INDEX IF EXISTS idx_${tableName}_deleted_at;\n`;
        downSql += '\n';
    }
}

const fixDir = path.join(migrationsDir, 'phase6_schema');
if (!fs.existsSync(fixDir)) {
    fs.mkdirSync(fixDir);
}

fs.writeFileSync(path.join(fixDir, '000001_standardize_schema.up.sql'), upSql);
fs.writeFileSync(path.join(fixDir, '000001_standardize_schema.down.sql'), downSql);
fs.writeFileSync(path.join(fixDir, 'report.json'), JSON.stringify(report, null, 2));

console.log("Successfully generated Phase 6 schema standardization script.");
