var express = require('express');
var router = express.Router();
var Google = require('../services/google');

router.post('/login', (req, res) => {
  Google.verifyToken(req.body.token).then((user) => {
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
  })
  .catch((error) => {
    console.log(error);
    res.send({
      success: false,
      message: error
    });
  })
});

router.get('*', (req, res) => {
  res.render('index', {
    env: {
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
      GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || ''
    }
  });
});

module.exports = router;
