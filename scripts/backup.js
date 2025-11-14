/**
 * Database Backup Script
 * Creates backups of the database with rotation
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '..', 'backups');
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS) || 7; // Keep last 7 backups
const DB_DIALECT = process.env.DB_DIALECT || 'sqlite';

async function createBackup() {
  try {
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}`;

    console.log(`Creating backup: ${backupFileName}`);

    if (DB_DIALECT === 'sqlite') {
      await backupSQLite(backupFileName);
    } else if (DB_DIALECT === 'postgres') {
      await backupPostgres(backupFileName);
    } else {
      throw new Error(`Unsupported database dialect: ${DB_DIALECT}`);
    }

    console.log(`✓ Backup created successfully: ${backupFileName}`);

    // Rotate old backups
    await rotateBackups();

    console.log('✓ Backup rotation completed');

    return backupFileName;
  } catch (error) {
    console.error('✗ Backup failed:', error.message);
    throw error;
  }
}

async function backupSQLite(backupFileName) {
  const dbPath = process.env.DB_STORAGE || './database.sqlite';
  const backupPath = path.join(BACKUP_DIR, `${backupFileName}.sqlite`);

  // Copy SQLite database file
  fs.copyFileSync(dbPath, backupPath);

  // Compress the backup
  await execPromise(`gzip ${backupPath}`);

  return `${backupFileName}.sqlite.gz`;
}

async function backupPostgres(backupFileName) {
  const backupPath = path.join(BACKUP_DIR, `${backupFileName}.sql`);

  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 5432;
  const database = process.env.DB_NAME || 'mysoulmate';
  const user = process.env.DB_USER || 'postgres';

  // Use pg_dump to create backup
  const command = `PGPASSWORD=${process.env.DB_PASSWORD} pg_dump -h ${host} -p ${port} -U ${user} -F p -f ${backupPath} ${database}`;

  await execPromise(command);

  // Compress the backup
  await execPromise(`gzip ${backupPath}`);

  return `${backupFileName}.sql.gz`;
}

async function rotateBackups() {
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('backup-'))
    .map(file => ({
      name: file,
      path: path.join(BACKUP_DIR, file),
      time: fs.statSync(path.join(BACKUP_DIR, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time); // Sort by newest first

  // Delete old backups
  if (files.length > MAX_BACKUPS) {
    const filesToDelete = files.slice(MAX_BACKUPS);
    for (const file of filesToDelete) {
      fs.unlinkSync(file.path);
      console.log(`  Deleted old backup: ${file.name}`);
    }
  }
}

async function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('No backups found');
    return [];
  }

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.startsWith('backup-'))
    .map(file => ({
      name: file,
      path: path.join(BACKUP_DIR, file),
      size: fs.statSync(path.join(BACKUP_DIR, file)).size,
      time: fs.statSync(path.join(BACKUP_DIR, file)).mtime
    }))
    .sort((a, b) => b.time - a.time);

  return files;
}

async function restoreBackup(backupFileName) {
  try {
    const backupPath = path.join(BACKUP_DIR, backupFileName);

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupFileName}`);
    }

    console.log(`Restoring backup: ${backupFileName}`);

    // Decompress if necessary
    let restorePath = backupPath;
    if (backupFileName.endsWith('.gz')) {
      await execPromise(`gunzip -k ${backupPath}`);
      restorePath = backupPath.replace('.gz', '');
    }

    if (DB_DIALECT === 'sqlite') {
      await restoreSQLite(restorePath);
    } else if (DB_DIALECT === 'postgres') {
      await restorePostgres(restorePath);
    }

    console.log('✓ Backup restored successfully');

    // Clean up decompressed file
    if (restorePath !== backupPath) {
      fs.unlinkSync(restorePath);
    }
  } catch (error) {
    console.error('✗ Restore failed:', error.message);
    throw error;
  }
}

async function restoreSQLite(backupPath) {
  const dbPath = process.env.DB_STORAGE || './database.sqlite';

  // Backup current database
  if (fs.existsSync(dbPath)) {
    fs.copyFileSync(dbPath, `${dbPath}.before-restore`);
  }

  // Restore from backup
  fs.copyFileSync(backupPath, dbPath);
}

async function restorePostgres(backupPath) {
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || 5432;
  const database = process.env.DB_NAME || 'mysoulmate';
  const user = process.env.DB_USER || 'postgres';

  // Restore using psql
  const command = `PGPASSWORD=${process.env.DB_PASSWORD} psql -h ${host} -p ${port} -U ${user} -d ${database} -f ${backupPath}`;

  await execPromise(command);
}

// Run if called directly
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'create') {
    createBackup()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (command === 'list') {
    listBackups()
      .then(backups => {
        console.log('\nAvailable backups:');
        backups.forEach(backup => {
          console.log(`  ${backup.name} (${(backup.size / 1024).toFixed(2)} KB) - ${backup.time.toLocaleString()}`);
        });
      })
      .catch(() => process.exit(1));
  } else if (command === 'restore') {
    const backupFileName = process.argv[3];
    if (!backupFileName) {
      console.error('Please specify backup file to restore');
      process.exit(1);
    }
    restoreBackup(backupFileName)
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    console.log('Usage:');
    console.log('  node backup.js create           - Create a new backup');
    console.log('  node backup.js list             - List all backups');
    console.log('  node backup.js restore <file>   - Restore from backup');
  }
}

module.exports = { createBackup, listBackups, restoreBackup };
