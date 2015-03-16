
/**
 * Module dependencies.
 */

var express = require('express.io');
var http = require('http');
var path = require('path');
var util = require(__dirname + '/util.js');
var mkdirp = require('mkdirp');
var proxy = require('express-http-proxy');

var app = express();
app.http().io();
app.io.set('authorization', function (handshakeData, accept) {
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
app.use(express.favicon());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({secret: 'maisecret'}));
app.use(app.router);
app.use('/static', express.static(__dirname + '/static'));
// proxy for itunes requests
app.use('/proxy', proxy('https://itunes.apple.com', {
  forwardPath: function(req, res) {
    return require('url').parse(req.url).path;
  }
}));

// development only
if ('development' == app.get('env')) {
  // uncomment to nuke songs database
  // app.db.songs.remove({}, { multi: true }, function(err, numRemoved){
  //   console.log(numRemoved + " songs removed");
  // })
  app.use(express.errorHandler());
}

require(__dirname + '/routes').createRoutes(app);

app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
