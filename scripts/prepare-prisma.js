const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const arg = process.argv[2];

let dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl) {
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^DATABASE_URL\s*=\s*["']?([^"'\r\n]+)/m);
    if (match) {
      dbUrl = match[1].trim();
    }
  }
}

let target = 'mysql';
if (arg === 'force-postgres' || process.env.VERCEL === '1' || dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
  target = 'postgres';
} else if (arg === 'force-mysql') {
  target = 'mysql';
}

const sourceFile = target === 'postgres'
  ? path.join(rootDir, 'prisma/schema.postgres.prisma')
  : path.join(rootDir, 'prisma/schema.mysql.prisma');

const destFile = path.join(rootDir, 'prisma/schema.prisma');

if (fs.existsSync(sourceFile)) {
  const sourceContent = fs.readFileSync(sourceFile, 'utf8');
  const currentContent = fs.existsSync(destFile) ? fs.readFileSync(destFile, 'utf8') : '';

  if (sourceContent !== currentContent) {
    fs.writeFileSync(destFile, sourceContent, 'utf8');
    console.log(`[prepare-prisma] Active Prisma schema set to: ${target.toUpperCase()}`);
  } else {
    console.log(`[prepare-prisma] Prisma schema already using: ${target.toUpperCase()}`);
  }
} else {
  console.warn(`[prepare-prisma] Source schema not found: ${sourceFile}`);
}
