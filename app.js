
/**
 * Module dependencies.
 */

var express = require('express.io');
var routes = require('./routes/');
var user = require('./routes/user');
var config = require('./config');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 2000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('swig').renderFile);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('maisecret'));
app.use(express.bodyParser());
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/users', user.list);

app.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
