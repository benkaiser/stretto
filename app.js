
// Electron build
var ELECTRON = process.argv[2]=="electron";

/**
 * Module dependencies.
 */

var express = require('express.io');
var http = require('http');
var path = require('path');
var util = require(__dirname + '/util.js');
var mkdirp = require('mkdirp');
var proxy = require('express-http-proxy');

var eapp;

// Electron Specific
if(ELECTRON) {
var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.
var mainWindow = null;
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, height: 600});

  // init everything
  init();
  // and load the index.html of the app.
  mainWindow.loadUrl('http://localhost:'+eapp.get('port')+'/');

  // Open the DevTools.
  mainWindow.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
} else {
  init();
}
function init() {
eapp = express();
eapp.http().io();
eapp.io.set('authorization', function (handshakeData, accept) {
  // accept all requests
  accept(null, true);
});
// make sure the dbs directory is present
mkdirp(__dirname + '/dbs/covers', function(){
  // attach the db to the app
  require(__dirname + '/db.js')(eapp);
  // patch the app
  require(__dirname + '/patches.js')(eapp);
  // attach the config
  eapp.set('config', require(__dirname + '/config')(eapp));
});


// all environments
eapp.set('port', process.env.PORT || 2000);
eapp.set('views', path.join(__dirname, 'views'));
eapp.set('view engine', 'html');
eapp.set('root', __dirname);
eapp.set('started', Date.now());
eapp.engine('html', require('swig').renderFile);
eapp.use(express.favicon());
eapp.use(express.json());
eapp.use(express.urlencoded());
eapp.use(express.methodOverride());
eapp.use(express.cookieParser());
eapp.use(express.bodyParser());
eapp.use(express.session({secret: 'maisecret'}));
eapp.use(eapp.router);
eapp.use('/static', express.static(__dirname + '/static'));
// proxy for itunes requests
eapp.use('/proxy', proxy('https://itunes.apple.com', {
  forwardPath: function(req, res) {
    return require('url').parse(req.url).path;
  }
}));

// development only
if ('development' == eapp.get('env')) {
  // uncomment to nuke songs database
  // eapp.db.songs.remove({}, { multi: true }, function(err, numRemoved){
  //   console.log(numRemoved + " songs removed");
  // })
  eapp.use(express.errorHandler());
}

require(__dirname + '/routes').createRoutes(eapp);

eapp.listen(eapp.get('port'), function(){
  console.log('Express server listening on port ' + eapp.get('port'));
});
}
