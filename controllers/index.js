const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
var youtubeSearch = require('youtube-search');

const router = express.Router();
const Google = require('../services/google');
const DataMapper = require('../models/data_mapper');

const WebGoogle = new Google(process.env.GOOGLE_CLIENT_ID);
const AndroidGoogle = new Google(process.env.GOOGLE_CLIENT_ID_ANDROID);

function loggedIn(req, res, next) {
  if (req.session.loggedIn) {
    next();
  } else {
    res.status(403).send({ error: 'User not logged in' });
  }
}

function errorHandler(error) {
  console.log('Error:');
  console.log(error);
  this.send({
    success: false,
    message: JSON.stringify(error)
  });
}

function googleLogin(req, res) {
  req.params.googleModule.verifyToken(req.body.token).then((user) => {
    if (user.email === req.body.email) {
      req.session.user = user;
      req.session.loggedIn = true;
      res.send({
        success: true
      });
    } else {
      res.send({
        success: false,
        message: 'incorrect email'
      });
    }
  }).catch(errorHandler.bind(res));
}

router.post('/login', (req, res, next) => {
  req.params.googleModule = WebGoogle;
  next();
}, googleLogin);
router.post('/androidlogin', (req, res, next) => {
  req.params.googleModule = AndroidGoogle;
  next();
}, googleLogin);

router.get('/spotify_callback', (req, res) => {
  res.render('spotify_callback');
});

router.get('/latestversion', loggedIn, (req, res) => {
  DataMapper.getVersionForUser(req.session.user).then((version) => {
    res.send({ version: version });
  }).catch(errorHandler.bind(res));
});


router.get('/latestdata', loggedIn, (req, res) => {
  DataMapper.getDataForUser(req.session.user).then((data) => {
    res.send(data);
  }).catch(errorHandler.bind(res));
});

router.post('/uploaddata', loggedIn, (req, res) => {
  DataMapper.setDataForUser(req.body, req.session.user)
  .then((newVersion) => {
    console.log(newVersion);
    res.send({ success: true, version: newVersion })
  })
  .catch((error) => {
    res.send({ success: false, error: error });
  });
});

const searchOptions = {
  maxResults: 1,
  key: process.env.GOOGLE_API_KEY
};

function standardItem(itunesItem, youtubeResult) {
  return {
    title: itunesItem.trackName,
    artist: itunesItem.artistName,
    album: itunesItem.collectionName,
    cover: itunesItem.artworkUrl100.replace('100x100', '600x600'),
    id: 'y_' + youtubeResult.id
  };
}

function removeDuplicates(items) {
  const ids = [];
  return items.filter(item => {
    if (ids.indexOf(item.id) != -1) {
      return false;
    }
    ids.push(item.id);
    return true;
  });
}

function findYoutubeVideo(item) {
  return new Promise((resolve, reject) => {
    youtubeSearch(item.trackName + ' ' + item.artistName, searchOptions, (error, results) => {
      if (error) {
        console.log(error);
        return reject(error);
      }
      if (!results || !results.length) {
        console.log(results);
        console.log('no results from youtube search');
        return resolve(undefined);
      }
      resolve(standardItem(item, results[0]));
    });
  })
}

router.post('/search', loggedIn, (req, res) => {
  if (!req.body || !req.body.query) {
    return res.send('Missing parameter \'query\' in payload.');
  }
  fetch(`https://itunes.apple.com/search?term=${req.body.query}&entity=song&limit=50&country=us`)
  .then(response => response.json())
  .then(responseJson => {
    Promise.all(responseJson.results.map(findYoutubeVideo))
    .then(results => {
      results = removeDuplicates(results.filter((result) => !!result));
      res.send(results);
    });
  }).catch(() => {
    res.send('[]');
  })
});

router.post('/share', loggedIn, (req, res) => {
  if (!req.body || !req.body.playlist) {
    return res.send('Missing parameter \'playlist\' in payload.');
  }
  DataMapper.sharePlaylist(req.body.playlist, req.session.user).then(guid => {
    res.send({ guid: guid });
  });
});

function render(res, extraEnv) {
  res.render('index', {
    env: {
      ENV: process.env.ENV || 'production',
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
      SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || '',
      GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID || '',
      ...extraEnv
    }
  });
}

router.get('/shared/:guid', (req, res) => {
  if (!req.params || !req.params.guid) {
    return res.send('Missing parameter \'guid\' in url.');
  }
  DataMapper.getPlaylist(req.params.guid).then(playlistBlob => {
    render(res, {
      playlist: playlistBlob
    });
  });
});

router.get('/privacy', (req, res) => {
  res.sendFile('./privacy_policy.html', { root: path.resolve(__dirname, '../') });
});

router.get('*', (req, res) => {
  render(res);
});

module.exports = router;
