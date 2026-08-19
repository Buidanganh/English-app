const fs = require('fs');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || !databaseUrl.startsWith('file:')) {
  console.log('Skipping SQLite bootstrap: DATABASE_URL is not a SQLite file URL.');
  process.exit(0);
}

const databasePath = databaseUrl.slice('file:'.length);
const targetPath = path.isAbsolute(databasePath)
  ? databasePath
  : path.resolve(process.cwd(), 'prisma', databasePath);
const bundledDatabasePath = path.resolve(process.cwd(), 'prisma', 'dev.db');

if (fs.existsSync(targetPath)) {
  console.log(`SQLite database already exists at ${targetPath}.`);
  process.exit(0);
}

if (!fs.existsSync(bundledDatabasePath)) {
  throw new Error(`Bundled database was not found at ${bundledDatabasePath}.`);
}

fs.mkdirSync(path.dirname(targetPath), { recursive: true });
fs.copyFileSync(bundledDatabasePath, targetPath);
console.log(`Initialized SQLite database at ${targetPath} from the bundled account data.`);
