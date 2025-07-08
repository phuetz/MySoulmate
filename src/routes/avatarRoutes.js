const express = require('express');
const router = express.Router();
const multer = require('multer');
const avatarController = require('../controllers/avatarController');

const upload = multer({ dest: 'uploads/' });

router.post('/generate', upload.single('image'), avatarController.generateAvatar);

module.exports = router;
