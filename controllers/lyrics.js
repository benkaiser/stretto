const express = require('express');
const Lyrics = require('../models/lyrics');
const { findLyrics } = require('../services/lrclib');

const router = express.Router();

function respond(res, doc, cached) {
  res.send({
    lyrics: doc.plainLyrics,
    syncedLyrics: doc.syncedLyrics,
    match: doc.match,
    cached
  });
}

router.get('/lyrics', (req, res) => {
  const { id, title, artist } = req.query;
  const duration = parseFloat(req.query.duration) || 0;
  if (typeof id !== 'string' || typeof title !== 'string' || typeof artist !== 'string' || !id || id.length > 200) {
    return res.status(400).send({ error: 'id, title and artist are required' });
  }
  Lyrics.get(id)
    .then(cached => {
      if (cached) return respond(res, cached, true);
      return findLyrics({ title, artist, duration }).then(found => {
        if (!found) return res.status(404).send({ error: 'Lyrics not found' });
        return Lyrics.save(id, found)
          .catch(error => console.error('Failed to cache lyrics:', error))
          .then(() => respond(res, { plainLyrics: found.plainLyrics, syncedLyrics: found.syncedLyrics, match: found.match }, false));
      });
    })
    .catch(error => {
      console.error('Lyrics lookup failed:', error);
      res.status(502).send({ error: 'Lyrics lookup failed' });
    });
});

module.exports = router;
