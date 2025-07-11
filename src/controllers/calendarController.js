const ical = require('node-ical');

exports.importFromUrl = async (req, res, next) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ message: 'URL parameter is required' });
  }
  try {
    const data = await ical.async.fromURL(url);
    const events = Object.values(data)
      .filter((e) => e.type === 'VEVENT')
      .map((e) => ({
        id: e.uid || e.id,
        title: e.summary || '',
        description: e.description || '',
        date: e.start.toISOString().split('T')[0],
        time: e.start.toISOString().split('T')[1].substring(0,5),
      }));
    res.json({ events });
  } catch (err) {
    next(err);
  }
};
