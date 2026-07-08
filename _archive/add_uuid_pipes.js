const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'backend', 'src');

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.controller.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // Check if @Param('id') is used
            if (content.includes("@Param('id')")) {
                // Ensure ParseUUIDPipe is imported
                if (!content.includes('ParseUUIDPipe')) {
                    content = content.replace(/import \{([\s\S]*?)\} from '@nestjs\/common';/, (match, p1) => {
                        return `import {${p1}, ParseUUIDPipe } from '@nestjs/common';`;
                    });
                }
                
                // Replace @Param('id') with @Param('id', ParseUUIDPipe)
                content = content.replace(/@Param\('id'\)/g, "@Param('id', ParseUUIDPipe)");
                
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDirectory(srcDir);
