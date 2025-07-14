const { Expo } = require('expo-server-sdk');
const { PushToken } = require('../models');
const logger = require('../utils/logger');

const expo = new Expo();

exports.registerToken = async (req, res) => {
  try {
    const { token, userId, deviceId, platform } = req.body;
    if (!Expo.isExpoPushToken(token)) {
      return res.status(400).json({ message: 'Invalid Expo push token' });
    }
    await PushToken.upsert({ token, userId, deviceId, platform });
    return res.json({ success: true });
  } catch (err) {
    logger.error(`Failed to register push token: ${err.message}`);
    return res.status(500).json({ message: 'Failed to register token' });
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const { token, title, message, data } = req.body;
    if (!Expo.isExpoPushToken(token)) {
      return res.status(400).json({ message: 'Invalid Expo push token' });
    }
    await expo.sendPushNotificationsAsync([
      { to: token, sound: 'default', title, body: message, data },
    ]);
    return res.json({ success: true });
  } catch (err) {
    logger.error(`Failed to send push notification: ${err.message}`);
    return res.status(500).json({ message: 'Failed to send notification' });
  }
};
