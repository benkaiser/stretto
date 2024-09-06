const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const assert = require('assert');
const nodemailer = require('nodemailer');

const router = express.Router();
const Google = require('../services/google');
const DataMapper = require('../models/data_mapper');
const Itunes = require('../services/itunes');

const WebGoogle = new Google(process.env.GOOGLE_CLIENT_ID);

let transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  secure: true,
  port: 465,
  auth: {
    user: 'accounts@kaiserapps.com',
    pass: process.env.SMTP_PASSWORD,
  },
});

function loggedIn(req, res, next) {
  if (req.session.loggedIn) {
    next();
  } else {
    res.status(403).send({ error: 'Please login to continue' });
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

router.post('/googleLogin', (req, res) => {
  WebGoogle.verifyToken(req.body.token).then((user) => {
    if (user.email === req.body.email) {
      DataMapper.getUser(user.email).then((strettoUser) => {
        req.session.user = strettoUser;
        req.session.loggedIn = true;
        res.send({
          success: true
        });
      }).catch(() => {
        DataMapper.createAccountForGoogleUser(user.email, user).then((strettoUser) => {
          req.session.user = strettoUser;
          req.session.loggedIn = true;
          res.send({
            success: true
          });
        }).catch(() => {
          res.send({
            success: false,
            message: 'failed to create account'
          });
        });
      });
    } else {
      res.send({
        success: false,
        message: 'incorrect email'
      });
    }
  }).catch(errorHandler.bind(res));
});
router.post('/login', (req, res) => {
  DataMapper.loginUser(req.body.email, req.body.password)
  .then(user => {
    req.session.user = user;
    req.session.loggedIn = true;
    res.send({
      success: true
    });
  })
  .catch(error => {
    res.status(403);
    res.send({
      success: false,
      errorMessage: error
    });
  })
});
router.post('/createaccount', (req, res) => {
  DataMapper.createAccount(req.body.email, req.body.password)
  .then(user => {
    req.session.user = user;
    req.session.loggedIn = true;
    res.send({
      success: true
    });
  })
  .catch(error => {
    res.status(403);
    res.send({
      success: false,
      errorMessage: error
    });
  })
});
router.post('/checklogin', (req, res) => {
  if (req.session.loggedIn && req.session.user) {
    res.send({
      loggedIn: true,
      email: req.session.user.email
    });
  } else {
    res.status(403);
    res.send({
      loggedIn: false
    });
  }
});
router.post('/logout', (req, res) => {
  req.session.loggedIn = false;
  delete req.session.user;
  res.status(204).send({});
});
router.post('/forgotpassword', (req, res) => {
  DataMapper.getPasswordResetForUser(req.body.email)
  .then(resetToken => {
    res.status(204).send({});
    if (!resetToken) {
      return;
    }
    const link = "https://next.kaiserapps.com/reset/?token=" + resetToken;
    const mailOptions = {
      from: "accounts@kaiserapps.com",
      to: req.body.email,
      subject: "Stretto Password Reset",
      html: `To reset your password, please go to this link: <a href='${link}'>${link}</a>`,
    };
    transporter.sendMail(mailOptions, function(err, info) {
      if (err) {
        console.error("Failed to send order email");
        console.error(err);
      }
    });
  }).catch((error) => {
    console.error(error);
    res.status(204).send({});
  })
});
router.post('/completereset', (req, res) => {
  DataMapper.completePasswordReset(req.body.email, req.body.password, req.body.token)
  .then(success => {
    res.status(200).send({ success: true });
  }).catch((error) => {
    console.error(error);
    res.status(400).send({ success: false });
  })
});
router.get('/publicJsonLibrary', (req, res) => {
  res.send({
    publicJsonLibrary: req.session.user.publicJsonLibrary,
    libraryUrl: '/public/' + req.session.user.email + '/library.json'
  });
});
router.post('/publicJsonLibrary', (req, res) => {
  return DataMapper.setPublicJsonLibrary(req.session.user, req.body.publicJsonLibrary).then(() => {

    req.session.user.publicJsonLibrary = req.body.publicJsonLibrary;
    res.status(200).send({
      publicJsonLibrary: req.body.publicJsonLibrary
    });
  }).catch((error) => {
    console.error(error);
    res.status(400).send({});
  });
});
const azureFuncUrl = process.env.AZURE_FUNC_URL;
function transformLibraryToPublicJson(library) {
  return {
    music: library.songs.sort((a,b) => {
      return b.createdAt - a.createdAt;
    }).map((song) => {
      // Remove the prefix from song.id, that looks like a_ or s_ or y_ and just return the rest
      const originalId = song.id.replace(/^[a-zA-Z]_/, '');
      return {
        "id": song.id,
        "title": song.title,
        "album": song.album || "Unknown Album",
        "artist": song.artist,
        "genre": "Unknown",
        "source": azureFuncUrl + (song.isYoutube ? 'youtube' : 'soundcloud') + '?id=' + encodeURIComponent(originalId),
        "image": song.cover,
        "trackNumber": song.trackNumber || 1,
        "totalTrackCount": song.totalTrackCount || 100,
        "duration": song.duration
      }
    }),
    playlists: library.playlists,
  }
}
router.get('/public/:email/library.json', (req, res) => {
  if (!req.params || !req.params.email) {
    return res.send('Missing parameter \'email\' in url.');
  }
  return DataMapper.isUserJsonLibraryPublic(req.params.email)
  .then(isPublic => {
    if (!isPublic) {
      res.status(403).send({ error: "No public library available"});
    }
    DataMapper.getDataForUser({ email: req.params.email })
    .then(libraryData => {
      res.send(transformLibraryToPublicJson(libraryData));
    });
  });
});

router.get('/spotify_callback', (req, res) => {
  res.render('spotify_callback');
});

router.get('/serviceworker.js', (req, res) => {
  res.sendFile('./static/js/serviceworker.js', { root: path.resolve(__dirname, '../') });
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

router.get('/suggest/artists', loggedIn, (req, res) => {
  DataMapper.getFollowedArtists(req.session.user)
  .then(followedArtists => {
    return DataMapper.getTopArtists(req.session.user, followedArtists, 30, 0)
  })
  .then(artists => {
    return Promise.all(
      artists.map(artist => Itunes.getArtistResults(artist.artist))
    );
  })
  .then(itunesResponses => {
    const convertedItems = itunesResponses.map(response => {
      if (response && response.results && response.results.length > 0) {
        return response.results[0];
      } else {
        return undefined;
      }
    }).filter(item => !!item);
    return convertedItems.filter((item, index) => convertedItems.findIndex(filterMatch => item.artistId === filterMatch.artistId) === index);
  })
  .then(artistItems => {
    return Promise.all(
      artistItems.map(artist => {
        return Itunes.getPhotoOfArtist(artist.artistLinkUrl).then(coverUrl => Object.assign(artist, { artistCover: coverUrl}))
      })
    );
  })
  .then(data => {
    res.send(data);
  }).catch(errorHandler.bind(res));
});

router.get('/artists/followed/raw', loggedIn, (req, res) => {
  DataMapper.getFollowedArtists(req.session.user)
  .then(results => {
    res.send(results);
  }).catch(errorHandler.bind(res));
});

router.get('/artists/followed', loggedIn, (req, res) => {
  DataMapper.getFollowedArtists(req.session.user)
  .then(artists => Itunes.getSongsForArtists(artists))
  .then(results => {
    res.send(results);
  }).catch(errorHandler.bind(res));
});

router.post('/artists/follow', loggedIn, (req, res) => {
  DataMapper.followArtist(req.body.artist, req.session.user)
  .then(document => {
    if (document) {
      res.send({ success: true });
    } else {
      res.send({ success: false });
    }
  }).catch(errorHandler.bind(res));
});

router.post('/artists/unfollow', loggedIn, (req, res) => {
  DataMapper.unfollowArtist(req.body.artist, req.session.user)
  .then(document => {
    if (document) {
      res.send({ success: true });
    } else {
      res.send({ success: false });
    }
  }).catch(errorHandler.bind(res));
});

function validateSong(song) {
  assert.strictEqual(typeof song, 'object', 'Song is not an object');
  assert.strictEqual(typeof song.id, 'string', 'id is not a string');
  assert.strictEqual(typeof song.cover, 'string', 'cover is not a string');
  assert.strictEqual(typeof song.url, 'string', 'url is not a string');
  assert.strictEqual(typeof song.album, 'string', 'album is not a string');
  assert.strictEqual(typeof song.artist, 'string', 'artist is not a string');
  assert.strictEqual(typeof song.createdAt, 'number', 'createdAt is not a number');
  assert.strictEqual(typeof song.updatedAt, 'number', 'updatedAt is not a number');
  assert.strictEqual(typeof song.isYoutube, 'boolean', 'isYoutube is not a boolean');
  assert.strictEqual(typeof song.isSoundcloud, 'boolean', 'isSoundcloud is not a boolean');
  assert.strictEqual(typeof song.explicit, 'boolean', 'explicit is not a boolean');
  assert.strictEqual(typeof song.playInLibrary, 'boolean', 'playInLibrary is not a boolean');
}

function songPresent(song, data) {
  return data.songs.some(existingSong => existingSong.id === song.id);
}

function validatePlaylist(playlist, data) {
  assert.strictEqual(typeof playlist, 'string');
  assert.ok(data.playlists.some(existingPlaylist => existingPlaylist.title === playlist));
}

router.post('/addsong', loggedIn, (req, res) => {
  DataMapper.getDataForUser(req.session.user).then((data) => {
    validateSong(req.body.song);
    validatePlaylist(req.body.playlist, data)
    if (!songPresent(req.body.song, data)) {
      data.songs.push(req.body.song);
    }
    data.playlists = data.playlists.map(playlist => {
      if (playlist.title === req.body.playlist) {
        playlist.songs.push(req.body.song.id);
      }
      return playlist;
    });
    return DataMapper.setDataForUser(data, req.session.user)
    .then((newVersion) => {
      console.log("New version: " + newVersion);
      res.send({ success: true, version: newVersion })
    })
  }).catch(errorHandler.bind(res));
});

router.post('/uploaddata', loggedIn, (req, res) => {
  DataMapper.setDataForUser(req.body, req.session.user, req.query && req.query.force)
  .then((newVersion) => {
    console.log("New version: " + newVersion);
    res.send({ success: true, version: newVersion })
  })
  .catch((error) => {
    res.send({ success: false, error: error });
  });
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
      SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || '',
      GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID || '',
      SOUNDCLOUD_CLIENT_ID: process.env.SOUNDCLOUD_CLIENT_ID || '',
      YOUTUBE_REDIRECT_ENDPOINT: process.env.YOUTUBE_REDIRECT_ENDPOINT || '',
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

router.get('/redirect', (req, res) => {
  res.render('redirect');
});

router.get('/privacy', (req, res) => {
  res.sendFile('./privacy_policy.html', { root: path.resolve(__dirname, '../') });
});

router.get('*', (req, res) => {
  render(res);
});

module.exports = router;
