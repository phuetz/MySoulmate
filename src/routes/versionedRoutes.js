const express = require('express');
const v1Routes = require('./v1');

const router = express.Router();
const versions = {
  v1: v1Routes,
};

router.use((req, res, next) => {
  // Determine requested version from header, query, or path
  let version = req.params.version || req.headers['accept-version'] || req.query.v || 'v1';
  if (!version.startsWith('v')) {
    version = `v${version}`;
  }
  const selected = versions[version.toLowerCase()];
  if (!selected) {
    return res.status(400).json({ success: false, message: 'API version not supported' });
  }
  return selected(req, res, next);
});

module.exports = router;
