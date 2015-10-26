
/**
 * Module dependencies.
 */

var express = require('express.oi');
var favicon = require('serve-favicon');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var errorhandler = require('errorhandler');
var http = require('http');
var path = require('path');
var util = require(__dirname + '/util.js');
var mkdirp = require('mkdirp');
var proxy = require('express-http-proxy');

var app = express().http().io();

var sessionOpts = {
  secret: 'nmpsecret',
  resave: true,
  saveUninitialized: true,
};
app.io.session(sessionOpts);

app.io.set('authorization', function(handshakeData, accept) {
  // accept all requests
  accept(null, true);
});

// make sure the dbs directory is present
mkdirp(__dirname + '/dbs/covers', function(){
  // attach the db to the app
  require(__dirname + '/db.js')(app);
  // patch the app
  require(__dirname + '/patches.js')(app);
  // attach the config
  app.set('config', require(__dirname + '/config')(app));
});


// all environments
app.set('port', process.env.PORT || 2000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.set('root', __dirname);
app.set('started', Date.now());
app.engine('html', require('swig').renderFile);
app.use(favicon(__dirname + '/static/images/favicon.ico'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.session(sessionOpts));
app.use('/static', express.static(__dirname + '/static'));
// proxy for itunes requests
app.use('/proxy', proxy('https://itunes.apple.com', {
  forwardPath: function(req, res) {
    return require('url').parse(req.url).path;
  }
}));

// development only
if ('development' == app.get('env')) {
  app.use(errorhandler());
}

require(__dirname + '/routes').createRoutes(app);

app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
