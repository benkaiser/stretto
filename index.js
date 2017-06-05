require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const proxy = require('express-http-proxy');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
require('./services/google').initialise(process.env.GOOGLE_CLIENT_ID);

var app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/static', express.static('static'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('trust proxy', 1);
app.use(session({
  cookie: { secure: process.env.ENV != 'development' },
  resave: false,
  saveUninitialized: true,
  secret: 'stretto-secret',
  store: new MongoStore({
    url: process.env.MONGO_URL
  })
}));
app.use('/proxy', proxy('https://itunes.apple.com'));
app.use(require('./controllers'));

app.listen(process.env.PORT || 3000, function() {
  console.log("Let's get this party started!");
});
