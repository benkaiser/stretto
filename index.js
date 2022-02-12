require('dotenv').config();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const proxy = require('express-http-proxy');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const DataMapper = require('./models/data_mapper');

var sessionStore = new MongoDBStore({
  uri: process.env.MONGO_URL,
  collection: 'sessions'
});

sessionStore.on('error', function(error) {
  console.error(error);
});

var app = express();
var server = http.createServer(app);
var io = socketio(server);

app.use('/scapi', proxy('https://api-v2.soundcloud.com'));
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
app.use(require('./controllers'));
require('./controllers/socketio')(io);

server.listen(process.env.PORT || 3000, function() {
  console.log("Let's get this party started!");
});

DataMapper.initialize(process.env.MONGO_URL);
