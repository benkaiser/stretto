require('dotenv').config();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const proxy = require('express-http-proxy');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const DataMapper = require('./models/data_mapper');
require('./services/google').initialise(process.env.GOOGLE_CLIENT_ID);

var sessionStore = new MongoDBStore({
  uri: process.env.MONGO_URL,
  collection: 'sessions'
});

sessionStore.on('error', function(error) {
  assert.ifError(error);
  assert.ok(false);
});

var app = express();

app.set('view engine', 'pug');
app.set('views', __dirname + '/views');
app.use('/static', express.static('static'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(cookieParser());
app.set('trust proxy', 1);
app.use(session({
  cookie: {
    secure: process.env.ENV != 'development'
  },
  resave: false,
  name: 'stretto-next',
  saveUninitialized: true,
  secret: 'stretto-secret',
  store: sessionStore
}));
app.use('/proxy', proxy('https://itunes.apple.com'));
app.use(require('./controllers'));

app.listen(process.env.PORT || 3000, function() {
  console.log("Let's get this party started!");
});

DataMapper.initialize(process.env.MONGO_URL);
