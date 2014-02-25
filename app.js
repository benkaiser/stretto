
/**
 * Module dependencies.
 */

var express = require('express.io');
var http = require('http');
var path = require('path');
var util = require(__dirname + '/util.js');

var app = express();
app.http().io();
// make sure the dbs directory is present
util.mkdir(__dirname + '/dbs', function(){
  // attach the db to the app
  require(__dirname + '/db.js')(app);
  // make sure the cover directory is present
  util.mkdir(__dirname + '/dbs/covers', function(){});
});


// all environments
app.set('port', process.env.PORT || 2000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
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
