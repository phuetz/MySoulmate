const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.sqlite');
const BACKUP_DIR = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `database-${timestamp}.sqlite`);

fs.copyFile(DB_PATH, backupFile, (err) => {
  if (err) {
    console.error('Database backup failed:', err);
    process.exit(1);
  }
  console.log(`Database backed up to ${backupFile}`);
});
