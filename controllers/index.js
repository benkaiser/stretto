const express = require('express');
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
  console.log(error);
  this.send({
    success: false,
    message: JSON.stringify(error)
  });
}

function googleLogin(req, res, googleModule) {
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

router.get('*', (req, res) => {
  res.render('index', {
    env: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
      SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || ''
    }
  });
});

module.exports = router;
