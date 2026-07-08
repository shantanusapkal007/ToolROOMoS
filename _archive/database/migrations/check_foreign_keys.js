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
            if (!file.startsWith('phase')) { // Skip generated fix folders to avoid double parsing
                results = results.concat(getFiles(filePath));
            }
        } else if (file.endsWith('.up.sql')) {
            results.push(filePath);
        }
    });
    return results;
}

const upSqlFiles = getFiles(migrationsDir);
const tables = [];

upSqlFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const statements = content.split(';');
    statements.forEach(stmt => {
        const createTableMatch = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i);
        if (createTableMatch) {
            const tableName = createTableMatch[1].trim();
            tables.push(tableName);
        }
    });
});

// Remove duplicates
const uniqueTables = [...new Set(tables)];

let upSql = '';
let downSql = '';

uniqueTables.forEach(tableName => {
    // Generate foreign keys for standard fields
    if (tableName !== 'tenants' && tableName !== 'users' && tableName !== 'companies') {
        upSql += `-- Integrity constraints for ${tableName}\n`;
        downSql += `-- Revert integrity constraints for ${tableName}\n`;
        
        // Ensure tenant_id references tenants
        if (tableName !== 'tenants') {
            upSql += `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS fk_${tableName}_tenant;\n`;
            upSql += `ALTER TABLE ${tableName} ADD CONSTRAINT fk_${tableName}_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;\n`;
            downSql += `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS fk_${tableName}_tenant;\n`;
        }

        // Ensure company_id references companies
        if (tableName !== 'companies') {
            upSql += `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS fk_${tableName}_company;\n`;
            upSql += `ALTER TABLE ${tableName} ADD CONSTRAINT fk_${tableName}_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;\n`;
            downSql += `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS fk_${tableName}_company;\n`;
        }

        // Ensure user reference fields point to users
        upSql += `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS fk_${tableName}_created_by;\n`;
        upSql += `ALTER TABLE ${tableName} ADD CONSTRAINT fk_${tableName}_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;\n`;
        downSql += `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS fk_${tableName}_created_by;\n`;

        upSql += `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS fk_${tableName}_updated_by;\n`;
        upSql += `ALTER TABLE ${tableName} ADD CONSTRAINT fk_${tableName}_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL;\n`;
        downSql += `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS fk_${tableName}_updated_by;\n`;

        upSql += `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS fk_${tableName}_deleted_by;\n`;
        upSql += `ALTER TABLE ${tableName} ADD CONSTRAINT fk_${tableName}_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE SET NULL;\n`;
        downSql += `ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS fk_${tableName}_deleted_by;\n`;
        
        upSql += '\n';
        downSql += '\n';
    }
});

const fixDir = path.join(migrationsDir, 'phase7_integrity');
if (!fs.existsSync(fixDir)) {
    fs.mkdirSync(fixDir);
}

fs.writeFileSync(path.join(fixDir, '000001_enforce_foreign_keys.up.sql'), upSql);
fs.writeFileSync(path.join(fixDir, '000001_enforce_foreign_keys.down.sql'), downSql);

console.log("Successfully generated Phase 7 data integrity scripts.");
