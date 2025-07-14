const fs = require('fs');
const path = require('path');
const { sequelize, Session } = require('../src/models');
const logger = require('../src/utils/logger');

(async () => {
  try {
    await sequelize.authenticate();

    // Find expired sessions
    const expiredSessions = await Session.findAll({
      where: { expiresAt: { [sequelize.Op.lt]: new Date() } },
    });

    if (expiredSessions.length === 0) {
      logger.info('No expired sessions found');
      process.exit(0);
    }

    // Archive expired sessions to JSON file
    const archiveDir = path.join(__dirname, '..', 'archives');
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }
    const archiveFile = path.join(
      archiveDir,
      `sessions-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );
    fs.writeFileSync(archiveFile, JSON.stringify(expiredSessions, null, 2));

    // Delete expired sessions
    await Session.destroy({ where: { id: expiredSessions.map(s => s.id) } });
    logger.info(`Archived and removed ${expiredSessions.length} expired sessions.`);
    process.exit(0);
  } catch (err) {
    logger.error(`Cleanup failed: ${err.message}`);
    process.exit(1);
  }
})();
